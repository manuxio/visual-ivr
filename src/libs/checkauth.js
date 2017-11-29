export default (req, res, next) => {
  if (req.session.authenticated && req.session.askConfirmed && req.session.fullnameConfirmed) {
    next();
  } else {
    res.redirect('/nocode');
  }
};
