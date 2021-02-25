import { APIGatewayProxyEvent, Context } from "aws-lambda";

import { AuthorizeHandler } from "./infrastructure/handlers/AuthorizeHandler";
import { CallbackHandler } from "./infrastructure/handlers/CallbackHandler";
import { LoginHandler } from "./infrastructure/handlers/LoginHandler";
import { ProvidersHandler } from "./infrastructure/handlers/ProvidersHandler";
import { TokenHandler } from "./infrastructure/handlers/TokenHandler";

// authorization_code - token?grant_type=authorization_code&code=AUTH_CODE_HERE&redirect_uri=REDIRECT_URI&client_id=CLIENT_ID
// *not implemented* password (resource owner password grant) - token?grant_type=password&username=USERNAME&password=PASSWORD&client_id=CLIENT_ID
// *not implemented* client_credentials (client id and secret) - token?grant_type=client_credentials&client_id=CLIENT_ID&client_secret=CLIENT_SECRET
// *not implemented* refresh - token?grant_type=refresh_token&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&refresh_token=REFRESH_TOKEN
export function token(
  event: APIGatewayProxyEvent,
  context: Context
) {
  let handler = new TokenHandler();
  return handler.post(event, context);
}

/**
 * Authorize endpoint:
 * authorize?response_type=code&client_id=CLIENT_ID&redirect_uri=CALLBACK_URL&scope=read
 * authorize?response_type=token&client_id=CLIENT_ID&redirect_uri=CALLBACK_URL&scope=read+write
 * @param event
 * @param context
 */
export function authorize(
  event: APIGatewayProxyEvent,
  context: Context
) {
  let handler = new AuthorizeHandler();
  return handler.get(event, context);
}

/**
 * Callback handler
 * @param event
 * @param context
 */
export function callback(
  event: APIGatewayProxyEvent,
  context: Context
) {
  let handler = new CallbackHandler();
  return handler.get(event, context);
}

/**
 * Providers handler
 * @param event
 * @param context
 */
export function providers(
  event: APIGatewayProxyEvent,
  context: Context
) {
  let handler = new ProvidersHandler();
  return handler.get(event, context);
}

// login?session=1234
export function login(
  event: APIGatewayProxyEvent,
  context: Context
) {
  let handler = new LoginHandler();
  if (event.httpMethod.toLowerCase() === "get") {
    return handler.get(event, context);
  } else if (event.httpMethod.toLowerCase() === "post") {
    return handler.post(event, context);
  }
}
