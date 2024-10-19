sap.ui.define([
    "com/mindsquare/stock/transfer/controller/baseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"
], function (baseController, Filter, FilterOperator, MessageToast) {
    "use strict";

    return baseController.extend("com.mindsquare.stock.transfer.controller.bestand", {

        onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("bestand").attachPatternMatched(this._onObjectMatched, this);
			
            var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({
				materials: []
			});
			this.getOwnerComponent().setModel(oModel, "materialList");
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
			    // Load the fragment asynchronously using sap.ui.core.Fragment.load
			    sap.ui.core.Fragment.load({
			        id: oView.getId(),  // Optionally provide a unique ID for the dialog
			        name: "com.mindsquare.stock.transfer.view.fragments.addMaterial",  // Ensure this path is correct
			        controller: this  // The current controller will handle the events
			    }).then(function (oDialog) {
			        // Store the loaded fragment as the dialog
			        this.oDialog = oDialog;
			
			        // Add the dialog as a dependent to ensure lifecycle management
			        oView.addDependent(this.oDialog);
			
			        // Bind the dialog to the selected item's context
			        this.oDialog.bindElement({
			            path: sPath,  // Ensure sPath is correctly pointing to the item
			            model: "StockModel"
			        });
			
			        // Open the dialog
			        this.oDialog.open();
			    }.bind(this))  // Bind the "this" context to the controller
			    .catch(function (error) {
			        console.error("Error loading fragment:", error);
			    });
			} else {
			    // If the dialog already exists, just bind the element and open it
			    this.oDialog.bindElement({
			        path: sPath,  // The path of the selected item
			        model: "StockModel"
			    });
			    this.oDialog.open();
			}
		},
		
		       
    	onBtnCancelPress: function () {
            this.oDialog.close();
       },
       
		onBtnSubmitPress: function () {
            var oView = this.getView();
            var oDialog = this.oDialog;
            var oModel = this.getView().getModel("materialList");

            // Hole die Eingabedaten
            var oSelectedMaterial = oDialog.getBindingContext("StockModel").getObject();
            var oInputQuantity = sap.ui.core.Fragment.byId(this.getView().getId(), "iMenge");
    		var quantityValue = parseFloat(oInputQuantity.getValue());

            // Validierung
            if (isNaN(quantityValue) || quantityValue <= 0) {
                sap.m.MessageBox.error("Bitte geben Sie eine gültige Menge ein.");
                return;
            }

            // Überprüfe, ob das Material bereits im Warenkorb ist
            var aMaterialList = oModel.getProperty("/materials");
            var bMaterialExists = false;

            aMaterialList.forEach(function (oItem) {
                if (oItem.Matnr === oSelectedMaterial.Matnr && oItem.Lgort === oSelectedMaterial.Lgort) {
                    oItem.Menge += quantityValue;
                    bMaterialExists = true;
                }
            });

            // Füge das Material hinzu, wenn es noch nicht im Warenkorb ist
            if (!bMaterialExists) {
                var oNewEntry = {
                    Matnr: oSelectedMaterial.Matnr,
                    Maktx: oSelectedMaterial.Maktx,
                    Lgort: oSelectedMaterial.Lgort,
                    Werks: oSelectedMaterial.Werks,
                    Menge: quantityValue,
                    Meins: oSelectedMaterial.Meins
                };
                aMaterialList.push(oNewEntry);
            }

            oModel.setProperty("/materials", aMaterialList);
            MessageToast.show("Material hinzugefügt.");

            this.oDialog.close();
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
                        oList.getModel().updateBindings(true);
                        break;
                    case "MaterialList":
                        this.getView().byId("btnPost").setVisible(false);
                        break;
                }
            } catch (e) {
                this.getView().byId("btnPost").setVisible(true);
            }
        },

		
        onUpdateFinished: function () {
            var oModel = this.getView().getModel("materialList");
            var aMaterials = oModel.getProperty("/materials");
            this.getView().byId("basket").setCount(aMaterials.length);
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
		}
    });
});