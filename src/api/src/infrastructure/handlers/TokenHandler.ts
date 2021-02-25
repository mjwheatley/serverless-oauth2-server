import { APIGatewayProxyEvent, Context } from "aws-lambda";
import moment from "moment";
import * as validator from "validator";

import { Handler } from "../../core/handler";
import { IAuthorizationCodeRepository } from "../../core/repositories/IAuthorizationCodeRepository";
import { IClientRepository } from "../../core/repositories/IClientRepository";
import { ITokenRepository } from "../../core/repositories/ITokenRepository";
import { IUserRepository } from "../../core/repositories/IUserRepository";
import { UserToken } from "../models/Token";
import { AuthorizationCodeRepository } from "../repositories/AuthorizationCodeRepository";
import { ClientRepository } from "../repositories/ClientRepository";
import { TokenRepository } from "../repositories/TokenRepository";
import { UserRepository } from "../repositories/UserRepository";
import * as querystring from "querystring";

export class TokenHandler extends Handler {
  async post(
    event: APIGatewayProxyEvent,
    context: Context
  ) {
    try {
      const { Authorization: authorization, "Content-Type": contentType } = event.headers;
      if (!authorization) {
        return this.Unauthorized({
          error: "invalid_client",
          error_description: "Missing authorization header."
        });
      }
      if (!authorization.includes(`Basic`)) {
        return this.Unauthorized({
          error: "invalid_client",
          error_description: "Invalid authorization type."
        });
      }
      const base64Credentials = authorization.split(` `)[1];
      const credentialString = Buffer.from(base64Credentials, `base64`)
        .toString(`utf8`);
      const [client_id, clientSecret] = credentialString.split(`:`);

      let payload;
      switch (contentType) {
        case "application/x-www-form-urlencoded":
          payload = querystring.parse(event.body);
          break;
        case "application/json":
          payload = JSON.parse(event.body);
          break;
        default:
          return this.Unauthorized({
            error: "invalid_client",
            error_description: "Invalid Content-Type."
          });
      }
      const { grant_type, code, redirect_uri } = payload;

      // Validate client_id
      let clientRepository: IClientRepository = new ClientRepository();
      let client = await clientRepository.get(client_id);

      if (!client) {
        return this.Unauthorized({
          error: "invalid_client",
          error_description: "Request contains an invalid client id."
        });
      }

      // Validate client_secret
      if (clientSecret) {
        if (client.secret && clientSecret !== client.secret) {
          return this.Unauthorized({
            error: "invalid_client",
            error_description:
              "Request contains an invalid client secret."
          });
        }
      }

      // Validate grant type supported for this client
      if (client.grantType !== grant_type) {
        return this.BadRequest({
          error: "unsupported_grant_type",
          error_description: `Grant type not supported`
        });
      }

      // Call handler for grant type
      switch (grant_type) {
        case "authorization_code":
          return this.code({ client_id, code, redirect_uri });
        default:
          return this.BadRequest({
            error: "unsupported_grant_type",
            error_description: "Grant type not supported."
          });
      }
    } catch (err) {
      return this.Error({
        error: "server_error",
        error_description: err.message
      });
    }
  }

  private async code(payload: { client_id: string, code: string, redirect_uri: string }) {
    console.log(`Trace`, `code()`);
    // Parameters
    const { client_id, code, redirect_uri } = payload;

    // Validate code
    if (!validator.isLength(code, 32)) {
      throw new Error("Invalid authorization code");
    }

    // Get the auth_code
    const authorizationCodeRepository: IAuthorizationCodeRepository = new AuthorizationCodeRepository();
    const authorizationCode = await authorizationCodeRepository.get(code);
    console.log(`authorizationCode`, authorizationCode);

    if (authorizationCode === null || !authorizationCode.isValid()) {
      return this.BadRequest({
        error: "invalid_grant",
        error_description:
          "The authorization code is invalid or expired."
      });
    }

    // Validate
    if (redirect_uri !== authorizationCode.redirectUri) {
      return this.BadRequest({
        error: "invalid_grant",
        error_description: "The redirect uri code is invalid."
      });
    }

    // Validate
    let clientRepository: IClientRepository = new ClientRepository();
    let client = await clientRepository.get(client_id);
    console.log(`client`, client);

    if (client_id !== authorizationCode.clientId || !client) {
      return this.Unauthorized({
        error: "invalid_client",
        error_description: "Request contains an invalid client id."
      });
    }

    // Get the user
    const userRepository: IUserRepository = new UserRepository();
    const user = await userRepository.get(authorizationCode.subject);
    console.log(`user`, user);

    // Generate the access_token
    const secret = client.jwtSecret;
    let access_token = UserToken.create({
      type: "access",
      clientId: authorizationCode.clientId,
      issuer: process.env.BASE_URL,
      user: user
    });

    let id_token = UserToken.create({
      type: "id",
      issuer: process.env.BASE_URL,
      user: user,
      clientId: authorizationCode.clientId
    });

    // Save the tokens to the database
    const tokenRepository: ITokenRepository = new TokenRepository();
    console.log(`Saving access_token and id_token`);
    await tokenRepository.save(access_token);
    await tokenRepository.save(id_token);

    // Revoke the authorization code
    await authorizationCodeRepository.delete(authorizationCode.id);

    // Response
    let response: {
      access_token: string;
      id_token?: string;
      refresh_token?: string;
      token_type: "bearer" | "";
      expires_in?: number;
      scopes?: string;
      state?: string;
    } = {
      access_token: access_token.toJwt(secret),
      id_token: id_token.toJwt(secret),
      token_type: "bearer",
      expires_in: Math.round(
        moment
          .duration(
            moment(moment().add(1, "h")).diff(moment(new Date()))
          )
          .asSeconds()
      )
    };

    return this.Ok(response, {
      "Cache-Control": "no-store",
      Pragma: "no-cache"
    });
  }
}
