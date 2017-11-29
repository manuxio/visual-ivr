import stripslashes from '../libs/stripslashes';
import baseMethod from './basemethod';
import formatCurrency from 'format-currency';
import sha1 from 'sha1';
import moment from 'moment';
import logger from '../libs/logger';

const bin2hex = (s) => {
  let i;
  let l;
  let o = '';
  let n;
  s += '';
  for (i = 0, l = s.length; i < l; i += 1) {
    n = s.charCodeAt(i).toString(16);
    o += n.length < 2 ? '0' + n : n;
  }
  return o;
}

const createHashFromArray = (arrayOfStrings) => {
  const fullString = arrayOfStrings.reduce((prev, curr) => {
    return `${prev}${curr}`;
  }, '');
  const ascii = bin2hex(fullString);
  return sha1(ascii);
}

const getDate = () => {
  return moment().format('YYYY:MM:DD-HH:mm:ss');
}

export default class bnlPositivity extends baseMethod {

  constructor(params) {
    super(params);
    this.gateWay = params.param1;
    this.secret = params.param2;
    this.storeId = params.param3;
  }

  static getCallBackUrls() {
    return [
      {
        url: 'bnl_transaction_check',
        method: 'checkTransaction',
        httpMethod: 'post'
      },
      {
        url: 'bnl_positivity_success',
        method: 'checkSuccess',
        httpMethod: 'post'
      },
      {
        url: 'bnl_positivity_failure',
        method: 'checkUserFailure',
        httpMethod: 'post'
      }
    ]
  }

  static checkUserFailure(req, res, next) {
    const {
      session,
      body
    } = req;
    if (!body || !body.approval_code) {
      console.warn('[BNL Positivity] Fraud attempt, invalid body');
      logger(req, `Tentativo di post senza validi parametri`, 'audit').then(
        (result) => {
          next(500);
        }
      );
      return;
    }
    const {
      approval_code,
      status: remotestatus,
      terminal_id,
      currency,
      chargetotal,
      txntype,
      ERROR_LIST,
      MYBANK,
      oid,
      refnumber,
      addInfo3,
      addInfo4,
      response_hash
    } = body;

    req.dbConnection.query(`SELECT * FROM onlinePaymentTransactions WHERE ID = ${req.dbConnection.escape(addInfo4)}`)
    .then(
      (results) => {
        if (!results || results.length !== 1) {
          console.warn('Unable to validate addInfo4', addInfo4);
          return Promise.reject('Unable to validate addInfo4');
        }
        // console.log(results);
        return results[0];
      },
      (e) => Promise.reject(e)
    )
    .then(
      (txConfig) => {
        const fullConfig = JSON.parse(txConfig.fullconfig);
        const myHash = createHashFromArray([fullConfig.secret, approval_code, fullConfig.chargetotal, 'EUR', fullConfig.dateTime, fullConfig.storeId]);
        if (myHash === response_hash) {
          // console.log('TXID', txConfig.ID);
          return Promise.resolve(fullConfig);
        } else {
          console.warn('[BNL Positivity] invalid hash', myHash, notification_hash);
          const status = 'FRAUD';
          return req.dbConnection
          .query(`UPDATE onlinePaymentTransactions SET
            completed = 1,
            status = ${req.dbConnection.escape(status)},
            remotestatus = ${req.dbConnection.escape(remotestatus)}
            body = ${req.dbConnection.escape(JSON.stringify(req.body))},
            updatetime = NOW()
            WHERE ID = ${req.dbConnection.escape(addInfo4)}`)
          .then(
            (result) => Promise.reject('Fraud'),
            (e) => Promise.reject(e)
          );
        }
        // return Promise.reject('Wrong hash');
      },
      (e) => Promise.reject(e)
    )
    .then(
      (fullConfig) => {
        let status = 'NOT APPROVED';
        let realApprovalCode = approval_code;
        if (approval_code.substr(0, 1) === 'Y') {
          status = 'PENDING';
          if (remotestatus === 'APPROVED' || remotestatus === 'APPROVATO' || remotestatus === 'GENEHMIGT') {
            status = 'APPROVED';
          }
        }
        // console.log('Db query', `UPDATE onlinePaymentTransactions SET completed = 1, status = ${req.dbConnection.escape(status)}, remotestatus = ${req.dbConnection.escape(remotestatus)} WHERE ID = ${req.dbConnection.escape(addInfo4)}`);
        return req.dbConnection
        .query(`UPDATE onlinePaymentTransactions SET
          approvalCode = ${req.dbConnection.escape(realApprovalCode)},
          completed = 1,
          status = ${req.dbConnection.escape(status)},
          remotestatus = ${req.dbConnection.escape(stripslashes(remotestatus))},
          body = ${req.dbConnection.escape(JSON.stringify(req.body))},
          updatetime = NOW()
          WHERE ID = ${req.dbConnection.escape(addInfo4)}
        `)
        .then(
          () => {
            return Promise.resolve();
          },
          (e) => Promise.reject(e)
        )
        .then(
          () => Promise.resolve(fullConfig),
          (e) => Promise.reject(e)
        )
      },
      (e) => Promise.reject(e)
    )
    .then(
      (fullConfig) => {
        logger(req, `Pagamento annullato da codice url: ${fullConfig.urlCode}`, 'log', fullConfig.urlCode);
        return req.dbConnection.query(`SELECT
          SUM(ImportiContratto.ValoreA) AS affidato,
          SUM(ImportiContratto.ValoreR) AS recuperato,
          LookupImporti.NomeImportoEsteso as NomeImporto,
          ImportiContratto.IDImporto,
          SUM(ValoreA - ValoreR) AS importoResiduo
        FROM LookupImporti, ImportiContratto
        WHERE ImportiContratto.idContratto = ${req.dbConnection.escape(fullConfig.idContratto)} AND LookupImporti.ID = ImportiContratto.IDImporto
        GROUP BY ImportiContratto.IDImporto
        ORDER BY ImportiContratto.IDImporto`)
        .then(
          (results) => {
            session.pendingTransaction = addInfo4;
            // console.log('req.session.fullDbRecords', req.session);
            req.session.fullDbRecords.importi = results;
            return Promise.resolve();
          },
          (e) => { next(e); }
        );
      },
      (e) => {
        res.status(500).send('Something is not quite as it should!');
      }
    )
    .then(
      (result) => {
        res.redirect('/vivr/waittransactionresult');
      },
      (e) => {
        next(e);
      }
    )
  }

  static checkSuccess(req, res, next) {
    logger(req, `BNL Positivity, checking success with full body: ${JSON.stringify(req.body)}`, 'log')
    const {
      session,
      body
    } = req;
    const {
      dbRecord
    } = session;
    if (!body || !body.approval_code) {
      console.warn('[BNL Positivity] Fraud attempt, invalid body');
      logger(req, `Tentativo di post senza validi parametri`, 'audit').then(
        (result) => {
          next('Fraud attempt');
        }
      );
      return;
    }
    const {
      approval_code,
      status,
      terminal_id,
      currency,
      chargetotal,
      txntype,
      ERROR_LIST,
      MYBANK,
      oid,
      refnumber,
      addInfo3,
      addInfo4,
      response_hash
    } = body;
    if (!addInfo4) {
      res.render(`${session.domain}/vivr/genericerror`, Object.assign({}, req.baseParams, {
        title: `Errore in fase di pagamento`,
        body: 'Si &egrave; verificato un errore in fase di pagamento, ti preghiamo di riprovare nuovamente.',
        anagraficaEnabled: true,
        informazioniMandatoEnabled: true,
        payNowEnabled: true,
        contactEnabled: true,
        homeEnabled: true
      }));
      return;
    }
    // console.log('${req.dbConnection.escape(addInfo4)}', req.dbConnection.escape(addInfo4));
    req.dbConnection.query(`SELECT * FROM onlinePaymentTransactions WHERE ID = ${req.dbConnection.escape(addInfo4)}`)
    .then(
      (results) => {
        if (!results || results.length !== 1) {
          return Promise.reject(`Unable to validate addInfo4: ${addInfo4}`);
        }
        // console.log(results);
        return results[0];
      },
      (e) => Promise.reject(e)
    )
    .then(
      (txConfig) => {
        const fullConfig = JSON.parse(txConfig.fullconfig);
        // console.log('fullConfig', fullConfig);
        const myHash = createHashFromArray([fullConfig.secret, approval_code, fullConfig.chargetotal, 'EUR', fullConfig.dateTime, fullConfig.storeId]);
        if (myHash === response_hash) {
          session.pendingTransaction = txConfig.ID;
          return Promise.resolve();
        }
        return Promise.reject(`Wrong hash: ${myHash} !== ${response_hash}`);
      },
      (e) => Promise.reject(e)
    )
    .then(
      (result) => {
        req.dbConnection.query(`SELECT
          SUM(ImportiContratto.ValoreA) AS affidato,
          SUM(ImportiContratto.ValoreR) AS recuperato,
          LookupImporti.NomeImportoEsteso as NomeImporto,
          ImportiContratto.IDImporto,
          SUM(ValoreA - ValoreR) AS importoResiduo
        FROM LookupImporti, ImportiContratto
        WHERE ImportiContratto.idContratto = ${req.dbConnection.escape(dbRecord.idcontratto)} AND LookupImporti.ID = ImportiContratto.IDImporto
        GROUP BY ImportiContratto.IDImporto
        ORDER BY ImportiContratto.IDImporto`)
        .then(
          (results) => {
            req.session.fullDbRecords.importi = results;
            res.redirect('/vivr/waittransactionresult');
          },
          (e) => { next(e); }
        )
      },
      (e) => {
        console.warn('[BNL Positivity] Fraud attempt', e);
        logger(req, e, 'audit').then(
          (result) => {
            next('Fraud attempt');
          }
        );
      }
    );

  }

  static checkFailure(req, res, next) {
    logger(req, `BNL Positivity, checking failure with full body: ${JSON.stringify(req.body)}`, 'log')
    const {
      session
    } = req;
    res.render(`${session.domain}/vivr/genericerror`, Object.assign({}, req.baseParams, {
      title: `Errore in fase di pagamento`,
      body: 'Si &egrave; verificato un errore in fase di pagamento, ti preghiamo di riprovare nuovamente.',
      anagraficaEnabled: true,
      informazioniMandatoEnabled: true,
      payNowEnabled: true,
      contactEnabled: true,
      homeEnabled: true
    }));

  }

  static checkTransaction(req, res, next) {
    logger(req, `BNL Positivity, transaction with full body: ${JSON.stringify(req.body)}`, 'log');
    const {
      session,
      body
    } = req;
    const {
      dbRecord
    } = session;
    if (!body || !body.approval_code) {
      console.warn('[BNL Positivity] Fraud attempt, invalid body');
      logger(req, `Tentativo di post senza validi parametri`, 'audit').then(
        (result) => {
          next(500);
        }
      );
      return;
    }
    const {
      approval_code,
      status: remotestatus,
      terminal_id,
      currency,
      chargetotal,
      txntype,
      ERROR_LIST,
      MYBANK,
      oid,
      refnumber,
      addInfo3,
      addInfo4,
      response_hash
    } = body;

    req.dbConnection.query(`SELECT * FROM onlinePaymentTransactions WHERE ID = ${req.dbConnection.escape(addInfo4)} and completed = 0`)
    .then(
      (results) => {
        if (!results || results.length !== 1) {
          console.warn('Unable to validate addInfo4', addInfo4);
          return Promise.reject('Unable to validate addInfo4');
        }
        // console.log(results);
        return results[0];
      },
      (e) => Promise.reject(e)
    )
    .then(
      (txConfig) => {
        const fullConfig = JSON.parse(txConfig.fullconfig);
        const myHash = createHashFromArray([fullConfig.secret, approval_code, fullConfig.chargetotal, 'EUR', fullConfig.dateTime, fullConfig.storeId]);
        if (myHash === response_hash) {
          // console.log('TXID', txConfig.ID);
          return Promise.resolve(fullConfig);
        } else {
          console.warn('[BNL Positivity] invalid hash', myHash, notification_hash);
          const status = 'FRAUD';
          return req.dbConnection
          .query(`UPDATE onlinePaymentTransactions SET
            completed = 1,
            status = ${req.dbConnection.escape(status)},
            remotestatus = ${req.dbConnection.escape(remotestatus)}
            body = ${req.dbConnection.escape(JSON.stringify(req.body))},
            updatetime = NOW()
            WHERE ID = ${req.dbConnection.escape(addInfo4)}`)
          .then(
            (result) => Promise.reject('Fraud'),
            (e) => Promise.reject(e)
          );
        }
        // return Promise.reject('Wrong hash');
      },
      (e) => Promise.reject(e)
    )
    .then(
      (fullConfig) => {
        let status = 'NOT APPROVED';
        let realApprovalCode = approval_code;
        if (approval_code.substr(0, 1) === 'Y') {
          status = 'PENDING';
          if (remotestatus === 'APPROVED' || remotestatus === 'APPROVATO' || remotestatus === 'GENEHMIGT') {
            status = 'APPROVED';
          }
        }
        // console.log('Db query', `UPDATE onlinePaymentTransactions SET completed = 1, status = ${req.dbConnection.escape(status)}, remotestatus = ${req.dbConnection.escape(remotestatus)} WHERE ID = ${req.dbConnection.escape(addInfo4)}`);
        return req.dbConnection
        .query(`UPDATE onlinePaymentTransactions SET
          approvalCode = ${req.dbConnection.escape(realApprovalCode)},
          completed = 1,
          status = ${req.dbConnection.escape(status)},
          remotestatus = ${req.dbConnection.escape(stripslashes(remotestatus))},
          body = ${req.dbConnection.escape(JSON.stringify(req.body))},
          updatetime = NOW()
          WHERE ID = ${req.dbConnection.escape(addInfo4)}
        `)
        .then(
          () => {
            if (status === 'APPROVED') {
              // idContratto, amount, type, reference
              const tmpVal = {
                module: 'bnlPositivity',
                paymentId: fullConfig.paymentId,
                txId: addInfo4
              };

              return baseMethod.insertPaymentIntoMainframe(req.dbConnection, fullConfig.idContratto, fullConfig.amount, 'BON', JSON.stringify(tmpVal));
            }
            return Promise.resolve();
          },
          (e) => Promise.reject(e)
        )
        .then(
          () => Promise.resolve(fullConfig),
          (e) => Promise.reject(e)
        )
      },
      (e) => Promise.reject(e)
    )
    .then(
      (fullConfig) => {
        logger(req, `Pagamento effettuato da codice url: ${fullConfig.urlCode}`, 'web', fullConfig.urlCode);
        res.status(200).send('Thank you!');
      },
      (e) => {
        res.status(500).send('Something is not quite as it should!');
      }
    );
  }

  getIntro() {
    let fullText = this.description;
    let total = this.amount;
    let commission = 0;
    if (this.commission) {
      if (this.commission_type === 'percentage') {
        commission = total / 100 * this.commission;
        total += commission;
      } else {
        commission = this.commission;
        total += commission;
      }
    }
    total = total.toFixed(2);
    // console.log('Here?', this.commission_type, this.commission);
    if (commission  > 0 && this.commission_type === 'percentage') {
      fullText += '<br />';
      fullText += `Al pagamento richiesto sar&agrave; aggiunta, a titolo di commissione, la quota dell'${this.commission}%, pari ad ${formatCurrency(commission, {format: '%s%v', symbol: '&euro; ', locale: 'it-IT'})}, per un <strong>totale di ${formatCurrency(total, {format: '%s%v', symbol: '&euro; ', locale: 'it-IT'})}</strong>`;
    } else if (this.commission > 0) {
      fullText += '<br />';
      fullText += `Al pagamento richiesto sar&agrave; aggiunta, a titolo di commissione, la somma fissa di ${formatCurrency(commission, { format: '%s%v', symbol: '&euro; ', locale: 'it-IT' })}, per un <strong>totale di ${formatCurrency(total, {format: '%s%v', symbol: '&euro; ', locale: 'it-IT'})}</strong>`;
    }
    return fullText;
  }

  getTitle() {
    return this.title;
  }

  getForm() {
    const dateTime = this.dateTime;
    let total = this.amount;
    let commission = 0;
    if (this.commission) {
      if (this.commission_type === 'percentage') {
        commission = total / 100 * this.commission;
        total += commission;
      } else {
        commission = this.commission;
        total += commission;
      }
    }
    total = total.toFixed(2);
    // storeId, dateTime, chargeTotal, currency, signature
    const hash = createHashFromArray([this.storeId, dateTime, total, this.currency, this.secret]);
    return `
      <form action="${this.gateWay}" method="POST">
        <input type="hidden" name="txntype" value="PURCHASE">
        <input type="hidden" name="timezone" value="CET">
        <input type="hidden" name="txndatetime" value="${dateTime}">
        <input type="hidden" name="hash" value="${hash}">
        <input type="hidden" name="storename" value="${this.storeId}">
        <input type="hidden" name="mode" value="payonly">
        <input type="hidden" name="currency" value="${this.currency}">
        <input type="hidden" name="language" value="IT">
        <input type="hidden" name="oid" value="${this.paymentId}">
        <input type="hidden" name="addInfo3" value="${this.info}">
        <input type="hidden" name="addInfo4" value="${this.localInfo}">
        <input type="hidden" name="responseSuccessURL" value="https://payment.serfin97srl.com/callback/bnl_positivity_success">
        <input type="hidden" name="responseFailURL" value="https://payment.serfin97srl.com/callback/bnl_positivity_failure">
        <input type="hidden" name="transactionNotificationURL" value="https://payment.serfin97srl.com/callback/bnl_transaction_check">
        <input type="hidden" name="chargetotal" value="${total}">
        <div class="form-group row">
          <button type="submit" class="btn btn-primary">Procedi con il pagamento</button>
        </div>
      </form>
    `;
  }

  setLocalInfo(info) {
    this.localInfo = info;
  }

  getReady() {
    if (!this.db) {
      return Promise.reject('DB FAILURE');
    }
    this.dateTime = getDate();
    let total = this.amount;
    let commission = 0;
    if (this.commission) {
      if (this.commission_type === 'percentage') {
        commission = total / 100 * this.commission;
        total += commission;
      } else {
        commission = this.commission;
        total += commission;
      }
    }
    total = total.toFixed(2);
    return this.db.query(`INSERT INTO
      onlinePaymentTransactions (
        module,
        fullconfig,
        paymentId,
        idContratto,
        status,
        amount,
        commission,
        total
      ) VALUES (
        ${this.db.escape('bnlpositivity')},
        ${this.db.escape(JSON.stringify({
          urlCode: this.urlCode,
          idContratto: this.idContratto,
          paymentId: this.paymentId,
          commission_type: this.commission_type,
          commission: this.commission,
          amount: this.amount,
          secret: this.secret,
          gateWay: this.gateWay,
          storeId: this.storeId,
          amount: this.amount,
          currency: this.currency,
          dateTime: this.dateTime,
          chargetotal: total,
          title: this.getTitle(),
          intro: this.getIntro()
        }))},
        ${this.db.escape(this.paymentId)},
        ${this.db.escape(this.idContratto)},
        ${this.db.escape('Waiting')},
        ${this.db.escape(this.amount)},
        ${this.db.escape(commission)},
        ${this.db.escape(total)}
      )`)
      .then(
        () => {
          return this.db.query('SELECT LAST_INSERT_ID() as myId')
        },
        (e) => Promise.reject(e)
      )
      .then(
        (results) => {
          this.setLocalInfo(results[0].myId);
          return Promise.resolve();
        },
        (e) => Promise.reject(e)
      );
  }
}
