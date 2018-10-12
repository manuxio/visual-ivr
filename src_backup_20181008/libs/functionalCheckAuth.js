export default (req) => {
  if (req.session && req.session.authenticated) {
    return true;
  } else {
    return false;
  }
};
