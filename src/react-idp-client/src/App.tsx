import React, { createContext, useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Link, Redirect, Route, Switch, useHistory, useLocation } from "react-router-dom";
import OAuth2Client from "client-oauth2";

const {
  REACT_APP_BASE_URL,
  REACT_APP_IDP_CLIENT_ID,
  REACT_APP_IDP_CLIENT_SECRET,
  REACT_APP_IDP_BASE_URI
} = process.env;

const idpClientOptions: any = {
  clientId: REACT_APP_IDP_CLIENT_ID,
  clientSecret: REACT_APP_IDP_CLIENT_SECRET,
  accessTokenUri: `${REACT_APP_IDP_BASE_URI}/oauth/token`,
  authorizationUri: `${REACT_APP_IDP_BASE_URI}/oauth/authorize`,
  redirectUri: `${REACT_APP_BASE_URL}/auth/idp/callback`,
  scopes: ["name", "email", "profile_picture", "birthday", "address"],
  state: `youknowwhere`
};
console.log(`idpClientOptions`, idpClientOptions);
const idpClient = new OAuth2Client(idpClientOptions);

// This example has 3 pages: a public page, a protected
// page, and a login screen. In order to see the protected
// page, you must first login. Pretty standard stuff.
//
// First, visit the public page. Then, visit the protected
// page. You're not yet logged in, so you are redirected
// to the login page. After you login, you are redirected
// back to the protected page.
//
// Notice the URL change each time. If you click the back
// button at this point, would you expect to go back to the
// login page? No! You're already logged in. Try it out,
// and you'll see you go back to the page you visited
// just *before* logging in, the public page.

export default function AuthExample() {
  return (
    <ProvideAuth>
      <Router>
        <div>
          <AuthButton/>

          <ul>
            <li>
              <Link to="/public">Public Page</Link>
            </li>
            <li>
              <Link to="/protected">Protected Page</Link>
            </li>
          </ul>

          <Switch>
            <Route path="/public">
              <PublicPage/>
            </Route>
            <Route path="/login">
              <LoginPage/>
            </Route>
            <PrivateRoute path="/protected">
              <ProtectedPage/>
            </PrivateRoute>
            <Route path="/auth/idp/callback">
              <IDPAuthCallbackPage/>
            </Route>
          </Switch>
        </div>
      </Router>
    </ProvideAuth>
  );
}

const fakeAuth = {
  isAuthenticated: false,
  signin(cb: any) {
    fakeAuth.isAuthenticated = true;
    setTimeout(cb, 100); // fake async
  },
  signout(cb: any) {
    fakeAuth.isAuthenticated = false;
    setTimeout(cb, 100);
  }
};

/** For more details on
 * `authContext`, `ProvideAuth`, `useAuth` and `useProvideAuth`
 * refer to: https://usehooks.com/useAuth/
 */
const authContext: any = createContext(``);

function ProvideAuth({ children }: any) {
  const auth = useProvideAuth();
  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  );
}

function useAuth() {
  return useContext(authContext);
}

function useProvideAuth() {
  const [user, setUser]: any = useState(null);

  const signin = (user: any, cb: any) => {
    return fakeAuth.signin(() => {
      setUser(user);
      cb();
    });
  };

  const signout = (cb: any) => {
    return fakeAuth.signout(() => {
      setUser(null);
      cb();
    });
  };

  return {
    user,
    signin,
    signout
  };
}

function AuthButton() {
  let history = useHistory();
  let auth: any = useAuth();

  return auth.user ? (
    <p>
      Welcome! {auth.user.name} {" "}
      <button
        onClick={() => {
          auth.signout(() => history.push("/"));
        }}
      >
        Sign out
      </button>
    </p>
  ) : (
    <p>You are not logged in.</p>
  );
}

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
function PrivateRoute({ children, ...rest }: any) {
  let auth: any = useAuth();
  return (
    <Route
      {...rest}
      render={({ location }) =>
        auth.user ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

function PublicPage() {
  return <h3>Public</h3>;
}

function ProtectedPage() {
  return <h3>Protected</h3>;
}

function LoginPage() {
  let history: any = useHistory();
  let location: any = useLocation();
  let auth: any = useAuth();

  let { from } = location.state || { from: { pathname: "/" } };
  let login = () => {
    // auth.signin(() => {
    //   history.replace(from);
    // });
    window.location.href = idpClient.code.getUri();
  };

  return (
    <div>
      <p>You must log in to view the page at {from.pathname}</p>
      <button onClick={login}>Log in</button>
    </div>
  );
}

const getQueryStringParams = (query: any) => {
  return query
    ? (/^[?#]/.test(query) ? query.slice(1) : query)
      .split("&")
      .reduce((params: any, param: any) => {
          let [key, value] = param.split("=");
          params[key] = value ? decodeURIComponent(value.replace(/\+/g, " ")) : "";
          return params;
        }, {}
      )
    : {};
};

function IDPAuthCallbackPage() {
  let history: any = useHistory();
  let location: any = useLocation();
  let auth: any = useAuth();
  // const queryParams = getQueryStringParams(location.search);
  // const { token, from } = queryParams;
  let { from } = location.state || { from: { pathname: "/" } };
  console.log(`from`, from);
  useEffect(() => {
    idpClient.code.getToken(window.location.href).then(async (response) => {
      console.log(`getToken() response`, response);
      const {
        data: {
          access_token: accessToken,
          id_token: idToken,
          refresh_token,
          token_type,
          expires_in,
          scopes,
          state
        }
      } = response;
      let user;
      if (idToken) {
        const base64Payload = idToken.split(`.`)[1];
        const payloadString = window.atob(base64Payload);
        user = JSON.parse(payloadString);
        auth.signin(user, () => {
          history.replace(from);
        });
      } else if (accessToken) {

      }
    }).catch((error: any) => {
      console.error(`getToken() Error`, error);
    });
  }, []);

  return (
    <div>
    </div>
  );
}
