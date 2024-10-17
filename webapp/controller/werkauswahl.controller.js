sap.ui.define([
    "com/mindsquare/stock/transfer/controller/baseController",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Text",
	"sap/ui/model/Sorter",
	"../model/formatter",
	"sap/m/MessageBox"
], function (baseController, Filter, FilterOperator, MessageToast, JSONModel, Button, formatter, Dialog, Text) {
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
            
            var oButton = this.byId("btnStock");
		    if (oButton) {
		        oButton.setVisible(true);  
		        oButton.setEnabled(false); 
		    }
            
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
       
        // Wird aufgerufen, wenn ein Werk im Dropdown ausgewählt wird
        onPlantSelectionChange: function (oEvent) {
            var sSelectedPlant = oEvent.getSource().getSelectedKey();
			var oModel = this.getOwnerComponent().getModel("globalModel");
			console.log(oModel.getProperty("/Werks"));
			var oButton = this.byId("btnStock");
            if (sSelectedPlant) {
                // Lagerorte für das ausgewählte Werk laden
                this._loadStorageLocations(sSelectedPlant, false);
				// Setze ein leeres Modell, um die Tabelle zu leeren
			    var oEmptyModel = new sap.ui.model.json.JSONModel([]);
			    this.getView().setModel(oEmptyModel, "StockModel");
                  // Lagerort-Dropdown sichtbar machen
                this.byId("lgortInput").setValue("");
                this.byId("lgortInput").setShowValueHelp(true);
                if (oButton) {
				    oButton.setEnabled(false); 
				}
            } else {
            }
        },

        onDestPlantSelectionChange: function (oEvent) {
            var sDestSelectedPlant = oEvent.getSource().getSelectedKey();
			var sSelectedDestPlant = this.byId("zwerksComboBox").getSelectedKey();
			var oButton = this.byId("btnStock");
            if (sDestSelectedPlant) {
                // Lagerorte für das ausgewählte Werk laden
                this._loadStorageLocations(sDestSelectedPlant, true);
                // Lagerort-Dropdown sichtbar machen
                this.byId("zlgortInput").setValue("");
                this.byId("zlgortInput").setShowValueHelp(true);
                if (oButton) {
				    oButton.setEnabled(false); 
				}
                
            } else {
            }
        },

        _loadStorageLocations: function (sPlant, bDestLgort) {
            var oModel = this.getView().getModel();
			var sModelName = bDestLgort ? "DLgort" : "Lgort";
            // Filtere die Lagerorte basierend auf dem ausgewählten Werk
            var aFilters = [new Filter("Werks", FilterOperator.EQ, sPlant)];

            oModel.read("/lgortItemSet", {
                filters: aFilters,
                success: function (oData) {
                    var oStorageLocModel = new sap.ui.model.json.JSONModel({ Lagerorte: oData.results });
                    this.getView().setModel(oStorageLocModel, sModelName);
                }.bind(this),
                error: function () {
                    MessageToast.show("Fehler beim Laden der Lagerorte.");
                }
            });
        },
		
        onStorageLocationChange: function () {
		    var sValue = this.byId("lgortInput").getValue();  
		    var sDValue = this.byId("zlgortInput").getValue();  
		    if (sValue.length === 4 && sDValue.length === 4) {
		        var sSelectedPlant = this.byId("werksComboBox").getSelectedKey();
		        var sSelectedDestPlant = this.byId("zwerksComboBox").getSelectedKey();
		        
		        var oButton = this.byId("btnStock");
		        if (oButton) {
		            oButton.setEnabled(true); 
		        }
		    } else {
		        var oButton = this.byId("btnStock");
		        if (oButton) {
		            oButton.setEnabled(false); 
		        }
		    }
		},

        onSuggestLgort: function (oEvent) {
		    var sTerm = oEvent.getParameter("suggestValue");  // Der eingegebene Wert
		    var aFilters = [];
			var sId = oEvent.getSource().getId() === "zlgortInput" ? "DLgort" : "Lgort"
		    if (sTerm) {
		        // Filtere basierend auf dem eingegebenen Begriff
		        aFilters.push(new sap.ui.model.Filter({
		            path: "Lgort",   // Lagerort wird gefiltert
		            operator: sap.ui.model.FilterOperator.Contains,
		            value1: sTerm
		        }));
		        aFilters.push(new sap.ui.model.Filter({
		            path: "Description",  // Beschreibung wird auch gefiltert
		            operator: sap.ui.model.FilterOperator.Contains,
		            value1: sTerm
		        }));
		    }
		
		    var oBinding = oEvent.getSource().getBinding("suggestionItems");
		    oBinding.filter(aFilters);
		},

		
		onValueHelpRequestLgort: function (oEvent) {
		    // Ermitteln der ID des auslösenden Elements
		    var sID = oEvent.getSource().getId();
		    var sLgort = (sID === this.getView().byId("zlgortInput").getId()) ? "DLgort" : "Lgort";
		    var sIDinput = (sID === this.getView().byId("zlgortInput").getId()) ? "zlgortInput" : "lgortInput";
		    console.log(sLgort);
		    // Modell für Lagerorte abrufen
		    var oModel = this.getView().getModel(sLgort); 
		    console.log(oModel);
		    if (oModel) {
			    // Dialog für die Lagerorte-Auswahl erstellen, falls er noch nicht existiert
			        this._oLgortValueHelpDialog = new sap.m.SelectDialog({
		            title: "Lagerort auswählen",
		            items: {
		                path: sLgort + ">/Lagerorte",
		                template: new sap.m.StandardListItem({
		                    title: "{" + sLgort + ">Lgort}",
		                    info: "{" + sLgort + ">Lgobe}"
		                })
		            },
		            confirm: function (oConfirmEvent) {
		                var oSelectedItem = oConfirmEvent.getParameter("selectedItem");
		                if (oSelectedItem) {
		                    var sKey = oSelectedItem.getTitle();
		                    console.log(sKey);
		                    this.getView().byId(sIDinput).setValue(sKey);
		                    this.onStorageLocationChange();
		                }
		            }.bind(this),
		            search: function (oSearchEvent) {
		                var sValue = oSearchEvent.getParameter("value");
		                var oFilter = new sap.ui.model.Filter({
		                    path: sLgort + ">Lgort",
		                    operator: sap.ui.model.FilterOperator.Contains,
		                    value1: sValue
		                });
		                oSearchEvent.getSource().getBinding("items").filter([oFilter]);
		            }
		        });
		
		        // Dialog als abhängiges Element hinzufügen
		        this.getView().addDependent(this._oLgortValueHelpDialog);
			    // Setze das Modell für den Dialog und öffne ihn
			    this._oLgortValueHelpDialog.setModel(oModel, sLgort);
			    this._oLgortValueHelpDialog.open();
		    }
		},

        navToBestand: function (oEvent) {
             // Zugriff auf das globale Modell
		    var oModel = this.getOwnerComponent().getModel("globalModel");
		    
		    // Werks und Lagerort aus dem Modell abrufen
		    var oWerks = oModel.getProperty("/Werks");
		    var oLgort = oModel.getProperty("/Lgort");

            // Navigate to the detail route (assuming you have set up the routing correctly)
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            
            oRouter.navTo("bestand", {
            	path: "bestands('" + oWerks + oLgort + "')",
                lgort: oLgort,
                werks: oWerks
                
            });
        }

    });
});