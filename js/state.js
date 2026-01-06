const initialState = {
  user: null,
  session: null,
  profile: null,
  role: "visitor",
  isAuthenticated: false,
  authAttemptCount: 0,
  lastAuthAttempt: 0,
};

let state = { ...initialState };
const subscribers = new Set();

export function getState() {
  return { ...state };
}

export function setState(patch) {
  state = { ...state, ...patch };
  subscribers.forEach((fn) => fn(getState()));
}

export function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

export function resetAuthState() {
  setState({
    user: null,
    session: null,
    profile: null,
    role: "visitor",
    isAuthenticated: false,
  });
}
