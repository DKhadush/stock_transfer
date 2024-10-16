sap.ui.define(
	[
		"com/mindsquare/stock/transfer/controller/baseController",
		"sap/m/Button",
		"sap/m/Dialog",
		"sap/m/Text",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/ui/model/json/JSONModel"
	],
	function (
		baseController,
		Button,
		Dialog,
		Text,
		MessageToast,
		MessageBox,
		JSONModel
	) {
		"use strict";
		var oAusme;
		return baseController.extend(
			"com.mindsquare.stock.transfer.controller.addMaterial", {
			onInit: function () {

				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("addMaterial").attachPatternMatched(this._onObjectMatched, this);
			},
			
			 _onObjectMatched: function (oEvent) {
			    // Fange die übergebenen Parameter ab
			    var sMatnr = oEvent.getParameter("arguments").matnr;
			    var sMaktx = oEvent.getParameter("arguments").maktx;
			    var sWerks = oEvent.getParameter("arguments").werks;
			    var sLgort = oEvent.getParameter("arguments").lgort;
			    var sMeins = oEvent.getParameter("arguments").meins;
				var sLabst = oEvent.getParameter("arguments").labst;
				
			    // Lade hier die Daten ins Model oder setze sie auf der View
			    var oModel = new sap.ui.model.json.JSONModel({
			        Matnr: sMatnr,
			        Werks: sWerks,
			        Lgort: sLgort,
			        Labst: sLabst,
			        Meins: sMeins,
			        Maktx: sMaktx
			    });
			    this.getView().setModel(oModel, "MaterialModel");
			}
		});
	}
);
