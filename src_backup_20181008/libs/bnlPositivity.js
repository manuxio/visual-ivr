import sha1 from 'sha1';
import moment from 'moment';

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

const createHash = (storeId, dateTime, chargeTotal, currency, signature) => {
  if (!storeId|| typeof storeId === 'undefined') {
    throw new Error('Cannot leave storeId empty!');
  }
  if (!dateTime|| typeof dateTime === 'undefined') {
    throw new Error('Cannot leave dateTime empty!');
  }
  if (!chargeTotal|| typeof chargeTotal === 'undefined') {
    throw new Error('Cannot leave chargeTotal empty!');
  }
  if (!currency|| typeof currency === 'undefined') {
    throw new Error('Cannot leave currency empty!');
  }
  if (!signature|| typeof signature === 'undefined') {
    throw new Error('Cannot leave signature empty!');
  }
  const ascii = bin2hex(`${storeId}${dateTime}${chargeTotal}${currency}${signature}`);
  return sha1(ascii);
}

const createResponseHash = (arrayOfStrings) => {
  const fullString = arrayOfStrings.reduce((prev, curr) => {
    return `${prev}${curr}`;
  }, '');
  const ascii = bin2hex(fullString);
  return sha1(ascii);
}

const getDate = () => {
  return moment().format('YYYY:MM:DD-HH:mm:ss');
}

export {
  createHash,
  createResponseHash,
  getDate
}

// //$storeId = "08000888_S";
//     $storeId = $identificativo_iban_serfin;
//     $ksig = "SERsiSb55fs5BQmt5Yhq5Ub55E5=";//PRODUZIONE
//     //$ksig = "xHosiSb08fs8BQmt9Yhq3Ub99E8=";//TEST
//     $stringToHash = $storeId . $dataInseritaNelFieldtxndatetime . $chargetotal . $currency . $ksig;
//     $ascii = bin2hex($stringToHash);
//     return sha1($ascii);
