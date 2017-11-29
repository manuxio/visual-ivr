import baseMethod from './basemethod';

export default class offlineMethod extends baseMethod {
  getIntro() {
    return this.description;
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
