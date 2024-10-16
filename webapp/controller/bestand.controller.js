sap.ui.define([
    "com/mindsquare/stock/transfer/controller/baseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function (baseController, Filter, FilterOperator, MessageToast, JSONModel) {
    "use strict";

    return baseController.extend("com.mindsquare.stock.transfer.controller.werkauswahl", {

        onInit: function () {
        	// Erstelle ein globales Modell
            var oData = {
                zielWerks: "", 
                Werks: "",
                zielLgort: "",
                Lgort: ""
            };
            
            var oGlobalModel = new JSONModel(oData);
            this.getOwnerComponent().setModel(oGlobalModel, "globalModel");

            // Router initialisieren
            this.getRouter().initialize();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("werkauswahl").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function () {
            // Load Werke and StorageLocations on view load
            this._loadWerks();
        },

        _loadWerks: function () {
            var oModel = this.getView().getModel();

            oModel.read("/werkItemSet", {
                success: function (oData) {
                    var oWerksModel = new sap.ui.model.json.JSONModel(oData.results);
                    this.getView().setModel(oWerksModel, "Werks");
                }.bind(this),
                error: function () {
                    MessageToast.show(this.getI18n().getText("noData"));
                }.bind(this)
            });
        },
        
        // Wird aufgerufen, wenn ein Werk im Dropdown ausgewählt wird
        onPlantSelectionChange: function (oEvent) {
            var sSelectedPlant = oEvent.getSource().getSelectedKey();
			var oModel = this.getOwnerComponent().getModel("globalModel");
			oModel.setProperty("/Werks", sSelectedPlant);  
            if (sSelectedPlant) {
                // Lagerorte für das ausgewählte Werk laden
                this._loadStorageLocations(sSelectedPlant);
				// Setze ein leeres Modell, um die Tabelle zu leeren
			    var oEmptyModel = new sap.ui.model.json.JSONModel([]);
			    this.getView().setModel(oEmptyModel, "StockModel");
                // Lagerort-Dropdown sichtbar machen
                this.byId("lgortComboBox").setSelectedKey(null);
                this.byId("lgortComboVBox").setVisible(true);
                this.byId("stockTable").setVisible(false);
                
            } else {
                // Lagerort-Dropdown ausblenden, wenn kein Werk ausgewählt ist
                this.byId("lgortComboVBox").setVisible(false);
                this.byId("stockTable").setVisible(false);
            }
        },
        
        onDestPlantSelectionChange: function (oEvent) {
            var sSelectedPlant = oEvent.getSource().getSelectedKey();
			var sSelectedDestPlant = this.byId("zwerksComboBox").getSelectedKey();
			
			var oModel = this.getOwnerComponent().getModel("globalModel");
			oModel.setProperty("/zielWerks", sSelectedDestPlant); 
            if (sSelectedPlant) {
                // Lagerorte für das ausgewählte Werk laden
                this._loadStorageLocations(sSelectedPlant);
                // Lagerort-Dropdown sichtbar machen
                this.byId("zlgortComboBox").setSelectedKey(null);
                this.byId("zlgortComboVBox").setVisible(true);
                this.byId("stockTable").setVisible(false);
                
            } else {
                // Lagerort-Dropdown ausblenden, wenn kein Werk ausgewählt ist
                this.byId("zlgortComboVBox").setVisible(false);
                this.byId("stockTable").setVisible(false);
            }
        },

        _loadStorageLocations: function (sPlant) {
            var oModel = this.getView().getModel();

            // Filtere die Lagerorte basierend auf dem ausgewählten Werk
            var aFilters = [new Filter("Werks", FilterOperator.EQ, sPlant)];

            oModel.read("/lgortItemSet", {
                filters: aFilters,
                success: function (oData) {
                    var oStorageLocModel = new sap.ui.model.json.JSONModel(oData.results);
                    this.getView().setModel(oStorageLocModel, "Lgort");
                }.bind(this),
                error: function () {
                    MessageToast.show("Fehler beim Laden der Lagerorte.");
                }
            });
        }, 
        
        onStorageLocationChange: function () {
            var sSelectedStorageLoc = this.byId("lgortComboBox").getSelectedKey();
            var sSelectedPlant = this.byId("werksComboBox").getSelectedKey();
            var sSelectedDestStorageLoc = this.byId("zlgortComboBox").getSelectedKey();
			var sSelectedDestPlant = this.byId("zwerksComboBox").getSelectedKey();
			
			var oModel = this.getOwnerComponent().getModel("globalModel");
			oModel.setProperty("/Lgort", sSelectedStorageLoc);   
			oModel.setProperty("/zielLgort", sSelectedDestStorageLoc);  
			
            if (sSelectedDestPlant && sSelectedPlant && sSelectedStorageLoc && sSelectedDestStorageLoc) {
        		// Bestände laden und manuell binden
	            this._loadStock(sSelectedPlant, sSelectedStorageLoc);
                // Zeige die Tabelle an
                this.byId("stockTable").setVisible(true);
            } 
            else {
        		oSmartTable.setVisible(false);
    		}
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
        
        navToDetail: function (oEvent) {
            // Get the selected context (the clicked row)
            var oSelectedItem = oEvent.getSource();
            var oContext = oSelectedItem.getBindingContext("StockModel");

            // Get the Material Number (Matnr) from the context
            var oMatnr = oContext.getProperty("Matnr");
            var oWerks = oContext.getProperty("Werks");
            var oLgort= oContext.getProperty("Lgort");

            // Navigate to the detail route (assuming you have set up the routing correctly)
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            
            oRouter.navTo("materialDetails", {
            	path: "materialDetails('" + oMatnr + "')",
                matnr: oMatnr,
                lgort: oLgort,
                werks: oWerks
                
            });
        }
    });
});