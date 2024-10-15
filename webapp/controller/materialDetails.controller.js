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
        
		onIconTabPress: function (oEvent) {

			try {
				switch (oEvent.getSource().getSelectedKey()) {
					case "Basket":
						this.getView().byId("btnPost").setVisible(true);
						var oList = this.getView().byId("basketList").getBinding("items");
						oList.getModel().updateBindings(true)
						break;
					case "MaterialList":
						this.getView().byId("btnPost").setVisible(false);

						var oInputField = this.getView().byId("iMaterial");
						jQuery.sap.delayedCall(750, this, function () {
							oInputField.focus();
						});

						break;
					case "Header":
						this.getView().byId("btnPost").setVisible(true);
						break;
				}
			} catch (e) {
				// console.log("Error, but show button.");
				this.getView().byId("btnPost").setVisible(true);
			}

		},
		
		onPressEvent: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oSelectedItem = oEvent.getSource();
            var oContext = oSelectedItem.getBindingContext("StockModel");

			var oList = this.getView().byId("basketList");
			var aItems = oList.getItems();
			if (aItems.length != 0) {
				oData.Menge = (parseFloat(oData.Menge) - parseFloat(this._getQuantityFromBasket(oData.Matnr, oData.Rspos))).toFixed(3);
			}
			
			var oMatnr = oContext.getProperty("Matnr");
            var oWerks = oContext.getProperty("Werks");
            var oLgort= oContext.getProperty("Lgort");
            var sMeins = oContext.getProperty("Meins");
    		var sLabst = oContext.getProperty("Labst");
    		var sMaktx = oContext.getProperty("Maktx");
            
			oRouter.navTo("addMaterial", {
				matnr: oMatnr,
                lgort: oLgort,
                werks: oWerks, 
                meins: sMeins,
                labst: sLabst,
                maktx: sMaktx
			});
		},

		onMaterialListItemPress: function (oEvent) {
			this.getView().byId("btnPost").setVisible(false);

			var oCtx = oEvent.getSource().getBindingContext("materialList");
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var sResult = {
				sMatnr: oEvent.getSource().getBindingContext("materialList").getProperty("Matnr"),
				sMatkx: oEvent.getSource().getBindingContext("materialList").getProperty("Matkx"),
				sLabst: oEvent.getSource().getBindingContext("materialList").getProperty("Labst"),
				sWerks: oEvent.getSource().getBindingContext("materialList").getProperty("Werks"),
				sLgort: oEvent.getSource().getBindingContext("materialList").getProperty("Lgort"),
				sPath: oCtx.getPath().substring(oCtx.getPath().lastIndexOf("/") + 1, oCtx.getPath().length),
				sFlag: "X"
			};

			var sDetails = JSON.stringify(sResult);

			oRouter.navTo("addMaterialMod", {
						details: sDetails
			});
		}
	});
});