import { APIGatewayProxyResult } from 'aws-lambda';

export abstract class Handler {
    Ok(
        body?: any,
        headers?: { [header: string]: string | number | boolean }
    ): APIGatewayProxyResult {
        const response = {
            statusCode: 200,
            headers: headers ? headers : null,
            body: body ? JSON.stringify(body) : null
        };
        console.log(response);
        return response;
    }

    Redirect(
        location: string,
        headers?: { [header: string]: string | number | boolean }
    ): APIGatewayProxyResult {
        if (!headers) {
            headers = {};
        }
        headers["Location"] = location;
        const response = {
            statusCode: 302,
            headers: headers ? headers : null,
            body: null
        };
        console.log(JSON.stringify(response));
        return response;
    }

    Error(
        body?: any,
        headers?: { [header: string]: string | number | boolean }
    ) {
        const response = {
            statusCode: 302,
            headers: headers ? headers : null,
            body: body ? JSON.stringify(body) : null
        };
        console.log(JSON.stringify(response));
        return response;
    }

    Unauthorized(
        body?: any,
        headers?: { [header: string]: string | number | boolean }
    ) {
        const response = {
            statusCode: 401,
            headers: headers ? headers : null,
            body: body ? JSON.stringify(body) : null
        };
        console.log(response);
        return response;
    }

    BadRequest(
        body?: any,
        headers?: { [header: string]: string | number | boolean }
    ) {
        const response = {
            statusCode: 400,
            headers: headers ? headers : null,
            body: body ? JSON.stringify(body) : null
        };
        console.log(response);
        return response;
    }
}
