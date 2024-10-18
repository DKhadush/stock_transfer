sap.ui.define([
    "com/mindsquare/stock/transfer/controller/baseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    
	"sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel"
], function (baseController, Filter, FilterOperator, MessageToast, JSONModel, Fragment) {
    "use strict";

    return baseController.extend("com.mindsquare.stock.transfer.controller.bestand", {

        onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("bestand").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
        	var oModel = this.getOwnerComponent().getModel("globalModel");
		    // Werks und Lagerort aus dem Modell abrufen
		    var oWerks = oModel.getProperty("/Werks");
		    var oLgort = oModel.getProperty("/Lgort");
		    
            // Load Werke and StorageLocations on view load
            this._loadStock(oWerks, oLgort);
        },

        _loadStock: function (sPlant, sStorageLoc) {
            var oModel = this.getView().getModel();

            var aFilters = [
                new Filter("Werks", FilterOperator.EQ, sPlant),
                new Filter("Lgort", FilterOperator.EQ, sStorageLoc)
            ];

		    oModel.read("/stockItemSet", {
		        filters: aFilters,
		        success: function (oData) {
		            if (oData.results.length > 0) {
		                var oStockModel = new sap.ui.model.json.JSONModel(oData.results);
		                this.getView().setModel(oStockModel, "StockModel");
		            } else {
		            	// Setze ein leeres Modell, um die Tabelle zu leeren
			            var oEmptyModel = new sap.ui.model.json.JSONModel([]);
			            this.getView().setModel(oEmptyModel, "StockModel");
		                sap.m.MessageToast.show("Keine Materialien vorhanden");
		            }
                }.bind(this),
                error: function () {
                    MessageToast.show("Keine Materialien für die Selektion gepflegt.");
		     
                }
            });
        },
       onMaterialPressEvent: function (oEvent) {
		    var oView = this.getView();
		    
		    // Get the selected item and its BindingContext
		    var oSelectedItem = oEvent.getSource();
		    var oContext = oSelectedItem.getBindingContext("StockModel");
		
		    // Extract the exact path (index) of the selected material
		    var sPath = oContext.getPath();  // This gives you something like "/0" or "/1", etc.
		
		    // Check if the dialog already exists
		    if (!this.oDialog) {
		        // Load the fragment and assign it to the oDialog property
		        this.oDialog = sap.ui.xmlfragment("com.mindsquare.stock.transfer.view.fragments.addMaterial", this);
		        
		        // Add the dialog as a dependent to the view to ensure it is destroyed correctly
		        oView.addDependent(this.oDialog);
		    }
		
		    // Bind the dialog to the selected item's context, passing the exact path
		    this.oDialog.bindElement({
		        path: sPath,  // Binds the dialog to the exact selected material based on the path
		        model: "StockModel"
		    });
		
		    // Open the dialog
		    this.oDialog.open();
		},
		
		       
		       onBtnCancelPress: function () {
		            this.oDialog.close();
		        },
				onBtnSubmitPress: function () {
		    var oView = this.getView();
		
		    // Erstellen des Fragments, falls noch nicht vorhanden
		    if (!this.oDialog) {
		        this.oDialog = sap.ui.xmlfragment("com.mindsquare.stock.transfer.view.fragments.addMaterial", this);
		        oView.addDependent(this.oDialog);
		    }
		
		    // Zugriff auf das Eingabefeld für Menge
		    var inputQuantity = sap.ui.core.Fragment.byId("com.mindsquare.stock.transfer.view.fragments.addMaterial", "iMenge");
			console.log(1);
		    if (!inputQuantity) {
		        sap.m.MessageBox.error("Das Eingabefeld für die Menge wurde nicht gefunden.");
		        return;
		    }
		
		    // Hole den Wert des Eingabefelds
		    var quantityValue = inputQuantity.getValue();
		
		    // Validierung der eingegebenen Menge
		    if (isNaN(quantityValue) || quantityValue <= 0) {
		        sap.m.MessageBox.error("Bitte geben Sie eine gültige Menge ein.");
		        return;
		    }
		
		    // Weitere Logik wie in deinem bestehenden Code...
		},

        onNavBack: function() {
		    var oHistory = sap.ui.core.routing.History.getInstance();
		    var sPreviousHash = oHistory.getPreviousHash();
		
		    if (sPreviousHash !== undefined) {
		        // Gehe zurück zur vorherigen Seite
		        window.history.go(-1);
		    } else {
		        // Falls keine Verlaufsdaten vorhanden sind, gehe zur Standardseite
		        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		        oRouter.navTo("home", {}, true); // Ändere "home" zu deiner Standardroute
		    }
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
            var oMeins = oContext.getProperty("Meins");
    		var oLabst = oContext.getProperty("Labst");
    		var oMaktx = oContext.getProperty("Maktx");
            
			oRouter.navTo("addMaterial", {
				matnr: oMatnr,
                lgort: oLgort,
                werks: oWerks, 
                meins: oMeins,
                labst: oLabst,
                maktx: oMaktx
			});
		},



    });
});