import moment from 'moment';

export default class paymentMethod {

  static getCallBackUrls() {
    throw new Error('Cannot use getCallBackUrls from base class!');
  }

  static leftPad(str, tolen, char = '0') {
    const len = str.length;
    const diff = tolen - len;
    const toprepend = diff > 0 ? char.repeat(diff) : '';
    return `${toprepend}${str}`;
  }

  static insertPaymentIntoMainframe(db, idContratto, amount, type, reference) {
    const nowDate = moment().format('YYYY-MM-DD HH:ii:ss');
    const sql = `INSERT INTO Assegni (
      CodiceContratto, Importo, TipoPagemento, data, note
    ) VALUES (
      ${db.escape(idContratto)}, ${db.escape(amount)}, ${db.escape(type)}, ${db.escape(nowDate)}, ${db.escape(reference)}
    )`;
    return db.query(sql)
    .then(
      (writeResult) => {
        // console.log('writeResult', writeResult);
        const lastInsertId = writeResult.insertId;
        return Promise.resolve([lastInsertId, nowDate]);
      },
      (e) => {
        return Promise.reject(e);
      }
    )
    .then(
      ([lastInsertId, nowDate]) => {
        const sql2 = `INSERT INTO ImportiContratto (IDcontratto, IDImporto, IDassegno, datascadenzapagamento, ValoreR)
        VALUES (
          ${db.escape(idContratto)},
          1,
          ${db.escape(lastInsertId)},
          ${db.escape(nowDate)},
          ${db.escape(amount)}
        )`;
        return db.query(sql2);
      },
      (e) => Promise.reject(e)
    )
    .then(
      (result) => {
        return Promise.resolve();
      },
      (e) => {
        console.log('E', e);
        return Promise.reject(e);
      }
    );
    // INSERT INTO Assegni (CodiceContratto, Importo,TipoPagemento,data)........

    // INSERT INTO ImportiContratto (IDcontratto,IDImporto,IDassegno,datascadenzapagamento,ValoreR)......


  }

  constructor(params) {
    this.param1 = params.param1;
    this.param2 = params.param2;
    this.param3 = params.param3;
    this.param4 = params.param4;
    this.title = params.title;
    // console.log('params', params.param1);
    this.description = params.description;
    this.commission_type = params.commission_type === 'fixed' ? 'fixed' : 'percentage';
    this.commission = params.commission;
    this.unique = Math.floor(Math.random() * 100000000) + 1;
    this.ID = params.ID;
  }

  setDb(db) {
    this.db = db;
  }

  setSession(session) {
    this.session = session;
  }

  setCurrency(currency) {
    this.currency = currency;
  }

  setAmount(amount) {
    this.amount = amount;
  }

  setPaymentId(oid) {
    this.paymentId = oid;
  }

  setIdContratto(oid) {
    this.idContratto = oid;
  }

  setInfo(info) {
    this.info = info;
  }

  setBaseUrl(host) {
    this.host = host;
  }

  setSecure(secure) {
    this.secure = secure;
  }

  getUnique() {
    return this.unique;
  }

  getIntro() {
    throw new Error('Cannot use getIntro of base class!');
  }

  getForm() {
    throw new Error('Cannot use getForm of base class!');
  }

  getTitle() {
    throw new Error('Cannot use getTitle of base class!');
  }

  getReady() {
    return Promise.resolve();
  }

  setUrlCode(code) {
    this.urlCode = code;
  }


}
