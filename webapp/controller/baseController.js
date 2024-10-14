sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text",
    "sap/m/MessageToast"
], function (Controller, History, Button, Dialog, Text, MessageToast) {
    "use strict";

    return Controller.extend("com.mindsquare.stock.transfer.controller.baseController", {

        getI18n: function () {
            // Ruft das ResourceBundle für die i18n-Texte ab
            return this.getView().getModel("i18n").getResourceBundle();
        },

        getRouter: function () {
            // Ruft den Router für die Navigation ab
            return sap.ui.core.UIComponent.getRouterFor(this);
        },

        _getModel: function (sModel) {
            // Gibt das angegebene Modell zurück
            return this.getView().getModel(sModel);
        },

        onNavBack: function () {
            // Navigation zur vorherigen Seite oder zur Startseite
            var sPreviousHash = History.getInstance().getPreviousHash();
            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("werkauswahl", {}, true /*no history*/);
            }
        },

        showMessageErrorDialog: function (message) {
            // Zeigt einen Fehlerdialog an
            var dialog = new Dialog({
                title: "Error",
                type: "Message",
                state: "Error",
                content: new Text({
                    text: message
                }),
                beginButton: new Button({
                    text: "OK",
                    press: function () {
                        dialog.close();
                    }
                }),
                afterClose: function () {
                    dialog.destroy();
                }
            });
            dialog.open();
        },

        showSuccessMessage: function (hdrMessageObject, iDuration) {
            // Zeigt eine Erfolgsmeldung an
            var duration = iDuration || 3000;
            sap.m.MessageToast.show(hdrMessageObject.message, {
                duration: duration,
                width: "15em",
                my: "center bottom",
                at: "center bottom",
                offset: "0 -100",
                collision: "fit fit",
                autoClose: true,
                animationTimingFunction: "ease",
                animationDuration: 1000,
                closeOnBrowserNavigation: true
            });
        },

        isEmpty: function (str) {
            // Überprüft, ob ein String leer ist
            return !str || str.length === 0;
        },

        setFocusOn: function (oControl) {
            // Setzt den Fokus auf das übergebene Control
            oControl.addEventDelegate({
                onAfterRendering: function () {
                    oControl.focus();
                }
            });
        }
    });
});
