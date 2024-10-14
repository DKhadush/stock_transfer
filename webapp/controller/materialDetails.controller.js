sap.ui.define([
	"com/mindsquare/stock/transfer/controller/baseController",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"../model/formatter",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/Device",
], function (baseController, Button, Dialog, Text, Filter, Sorter, FilterOperator, formatter, MessageBox, Fragment, Device) {
	"use strict";

	return baseController.extend("com.mindsquare.stock.transfer.controller.materialDetails", {
		_origin: "",
		formatter: formatter,
		onInit: function () {

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("materialDetails").attachPatternMatched(this._onObjectMatched, this);
		},
		
		 _onObjectMatched: function (oEvent) {
            // Load Material Infos on view load
            var sMatnr = oEvent.getParameter("arguments").matnr;
			var sPlant = oEvent.getParameter("arguments").werks;
			var sStorageLoc = oEvent.getParameter("arguments").lgort;
            this._loadDetails(sPlant, sStorageLoc, sMatnr);
        },
        
		_loadDetails: function (sPlant, sStorageLoc, sMatnr) {
            var oModel = this.getView().getModel();

            
		    oModel.read("/stockItemSet(Werks='" + sPlant + "',Lgort='" + sStorageLoc + "',Matnr='" + sMatnr + "')", {
		        success: function (oData) {
		            if (oData) {
		                var oStockModel = new sap.ui.model.json.JSONModel(oData);
						                
				        // Bestandsdaten aufteilen
				        var oFreeStock = [];
				        var oBlockedStock = [];
				        var oQualityStock = [];
				
				        // Füge hier die Logik hinzu, um die Bestandsmengen zu kategorisieren.
				        // Zum Beispiel könnte es so aussehen:
				        if (oData.Labst > 0) {
				            oFreeStock.push(oData);
				        }
				        if (oData.Sperrbestand > 0) {
				            oBlockedStock.push(oData);
				        }
				        if (oData.Qmbestand > 0) {
				            oQualityStock.push(oData);
				        }
				
				        // Die Sets in das StockModel laden
				        oStockModel.setProperty("/FreeStockSet", oFreeStock);
				        oStockModel.setProperty("/BlockedStockSet", oBlockedStock);
				        oStockModel.setProperty("/QualityStockSet", oQualityStock);

		                this.getView().setModel(oStockModel, "StockModel");
		            } else {
		            	// Setze ein leeres Modell, um die Tabelle zu leeren
			            var oEmptyModel = new sap.ui.model.json.JSONModel({
						            FreeStockSet: [],
						            BlockedStockSet: [],
						            QualityStockSet: []
						        });
				        
				        this.getView().setModel(oEmptyModel, "StockModel");
		                sap.m.MessageToast.show("No stock available for this selection.");
		            }
                }.bind(this),
                error: function () {
                    MessageToast.show("Fehler beim Laden der Bestände.");
                }
            });
        },
	});

});