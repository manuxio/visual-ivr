import baseMethod from './basemethod';

export default class offlineMethod extends baseMethod {
  getIntro() {
    const {
      dbRecord,
      fullDbRecords
    } = this.session;
    let numeriFatture = [];
    const fatture = fullDbRecords.fatture;
    if (fatture && fatture.length) {
      numeriFatture = fatture.map((f) => f.NumFattura);
    }
    let description = this.description;
    if (numeriFatture.length > 0) {
      // console.log('Replacing!');
      description = description.replace(/#numerifatture#/g, `numeri delle fatture ${numeriFatture.join(', ')}`);
    } else {
      // console.log('Not replacing!');
      description = description.replace(/#numerifatture#/g, `numeri delle fatture - `);
    }
    // console.log('getIntro', description);
    return description;
  }

  getTitle() {
    return this.title;
  }

  getForm() {
    return "";
  }

  static getCallBackUrls() {
    return [];
  }
}
