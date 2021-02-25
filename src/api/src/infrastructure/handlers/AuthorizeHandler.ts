import { APIGatewayProxyEvent, Context } from "aws-lambda";

import { Handler } from "../../core/handler";
import { IClientRepository } from "../../core/repositories/IClientRepository";
import { Session } from "../models/Session";
import { ClientRepository } from "../repositories/ClientRepository";
import { SessionRepository } from "../repositories/SessionRepository";

export class AuthorizeHandler extends Handler {
  async get(
    event: APIGatewayProxyEvent,
    context: Context
  ) {
    try {
      // Parameters
      const redirectUri = event.queryStringParameters.redirect_uri;
      const client_id = event.queryStringParameters.client_id;

      // Validate client_id
      let clientRepository: IClientRepository = new ClientRepository();
      let client = await clientRepository.get(client_id);

      if (!client) {
        return this.Unauthorized({
          error: "invalid_client",
          error_description: "Request contains an invalid client id."
        });
      }

      // Validate redirect_uri
      if (client.redirectUris.indexOf(redirectUri) === -1) {
        return this.Unauthorized({
          error: "invalid_grant",
          error_description:
            "Request contains an invalid redirect uri."
        });
      }

      // Create a new session
      let session = Session.Create({
        clientId: client_id,
        responseType: event.queryStringParameters.response_type as
          | "code"
          | "token",
        redirectUri: event.queryStringParameters.redirect_uri,
        state: event.queryStringParameters.state
      });

      const sessionRepository = new SessionRepository();
      await sessionRepository.save(session);

      return this.Redirect(session.getLoginUrl());
    } catch (err) {
      return this.Error({
        error: "server_error",
        error_description: err.message
      });
    }
  }
}
