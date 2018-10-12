export default (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    console.log('Unauthorized url', req.originalUrl, 'for session', req.sessionID, req.session);
    res.redirect('/nocode');
  }
};
