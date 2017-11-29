export default (req) => {
  if (req.session.authenticated && req.session.askConfirmed && req.session.fullnameConfirmed) {
    return true;
  } else {
    return false;
  }
};
