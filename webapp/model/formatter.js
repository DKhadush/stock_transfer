sap.ui.define([], function () {
	"use strict";
	return {
		materialListTitle: function (sAufnr) {
			var i18n = this.getView().getModel("i18n").getResourceBundle();
			return sAufnr ? i18n.getText("aufnr") + ": " + sAufnr: "";
		},
		
		_isMobileVersion: function(){
			var phone = sap.ui.Device.system.phone;
			return true;
		},
	};
});