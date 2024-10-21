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
        
         // Materialsuche in der Liste mit dynamischer Filterung
        onSearchMaterial: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");  // Der eingegebene Suchwert
            var aFilters = [];

            if (sQuery && sQuery.length > 0) {
                // Filter für Materialnummer (Matnr) oder Materialbeschreibung (Maktx)
                var oMatnrFilter = new Filter("Matnr", FilterOperator.Contains, sQuery);
                var oMaktxFilter = new Filter("Maktx", FilterOperator.Contains, sQuery);

                // Kombiniere die Filter mit OR-Verknüpfung
                aFilters = new Filter({
                    filters: [oMatnrFilter, oMaktxFilter],
                    and: false
                });
            }

            // Hole die Tabellenbindung und wende die Filter an
            var oTable = this.getView().byId("stockTable").getTable();
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);
        },
        
    	onMaterialPressEvent: function (oEvent) {
		    var oView = this.getView();
		    var oSelectedItem = oEvent.getSource();
		    var oContext = oSelectedItem.getBindingContext("StockModel");
		    var sPath = oContext.getPath(); 
			
		    if (!this.oDialog) {
			    sap.ui.core.Fragment.load({
			        id: oView.getId(),  
			        name: "com.mindsquare.stock.transfer.view.fragments.addMaterial",  
			        controller: this 
			    }).then(function (oDialog) {
			        // Store the loaded fragment as the dialog
			        this.oDialog = oDialog;
			
			        // Add the dialog as a dependent to ensure lifecycle management
			        oView.addDependent(this.oDialog);
			
			        // Bind the dialog to the selected item's context
			        this.oDialog.bindElement({
			            path: sPath, 
			            model: "StockModel"
			        });
			        // Open the dialog
			        this.oDialog.open();
			    }.bind(this))  
			    .catch(function (error) {
			        console.error("Error loading fragment:", error);
			    });
			} else {
			    // If the dialog already exists, just bind the element and open it
			    this.oDialog.bindElement({
			        path: sPath, 
			        model: "StockModel"
			    });
			    this.oDialog.open();
			}
		},
		
		onBasketMaterialPressEvent: function (oEvent) {
		    var oView = this.getView();
		    var oSelectedItem = oEvent.getSource();
		    var oContext = oSelectedItem.getBindingContext("materialList");
		    var sPath = oContext.getPath();
		    
		    if (!this.oDialog) {
		        sap.ui.core.Fragment.load({
		            id: oView.getId(),
		            name: "com.mindsquare.stock.transfer.view.fragments.addBasketMaterial",  // Neues Fragment für den Warenkorb
		            controller: this
		        }).then(function (oDialog) {
		            this.oDialog = oDialog;
		            oView.addDependent(this.oDialog);
		            
		            // Binde den Dialog an das ausgewählte Element im Warenkorb
		            this.oDialog.bindElement({
		                path: sPath,
		                model: "materialList"
		            });
		            
		            this.oDialog.open();
		        }.bind(this)).catch(function (error) {
		            console.error("Error loading fragment:", error);
		        });
		    } else {
		        // Wenn der Dialog schon existiert, einfach nur das Element binden und öffnen
		        this.oDialog.bindElement({
		            path: sPath,
		            model: "materialList"
		        });
		        this.oDialog.open();
		    }
		},
				
		onRemoveMaterialPress: function () {
		    var oModel = this.getView().getModel("materialList");
		    var sPath = this.oDialog.getBindingContext("materialList").getPath();
		    
		    // Entferne das Material aus der Liste
		    var aMaterials = oModel.getProperty("/materials");
		    aMaterials.splice(parseInt(sPath.split("/")[2]), 1);  // Entfernt das Material aus dem Array
		    oModel.setProperty("/materials", aMaterials);
		    
		    // Überprüfe, ob der Warenkorb leer ist, und blende den Button zum Senden aus
		    if (aMaterials.length === 0) {
		        this.getView().byId("btnTransfer").setVisible(false);
		    }
		    
		    this.oDialog.close();
		},

		       
    	onBtnCancelPress: function () {
            this.oDialog.close();
       },
       
        onBtnSubmitPress: function () {
		    var oView = this.getView();
		    var oDialog = this.oDialog;
		    var oModel = this.getView().getModel("materialList");
		    var oStockModel = this.getView().getModel("StockModel");
		
		    // Hole die Eingabedaten
		    var oSelectedMaterial = oDialog.getBindingContext("StockModel").getObject();
		    var oInputQuantity = sap.ui.core.Fragment.byId(this.getView().getId(), "iMenge");
		    var quantityValue = parseFloat(oInputQuantity.getValue());
		    oInputQuantity.setValue(0);
		    
		    
			var oSelectedMaterialPath = oDialog.getBindingContext("StockModel").getPath(); 
		    // Validierung
		    if (isNaN(quantityValue) || quantityValue <= 0) {
		        sap.m.MessageBox.error("Bitte geben Sie eine gültige Menge ein.");
		        return;
		    }
		
		    // Überprüfen, ob die eingegebene Menge größer ist als der verfügbare Bestand
		    var availableStock = parseFloat(oSelectedMaterial.Labst);
		    if (quantityValue > availableStock) {
		        sap.m.MessageBox.error("Die angegebene Menge überschreitet den verfügbaren Bestand.");
		        return;
		    }
		
		    // Überprüfen, ob das Material bereits im Warenkorb ist
		    var aMaterialList = oModel.getProperty("/materials");
		    var bMaterialExists = false;
		    var self = this; 
		    aMaterialList.forEach(function (oItem) {
		        if (oItem.Matnr === oSelectedMaterial.Matnr) {
		            var newTotalQuantity = parseFloat(oItem.bMenge) + quantityValue;
		
		            if (newTotalQuantity > availableStock) {
		                sap.m.MessageBox.error("Die angegebene Menge überschreitet den verfügbaren Bestand.");
		                return;
		            }
		
		            // Menge aktualisieren
		            oItem.bMenge = newTotalQuantity;
		            bMaterialExists = true;
					
		        	self.getView().getModel("StockModel").setProperty(oSelectedMaterialPath + "/bMenge", newTotalQuantity);
		            // Wenn Lagerbestand vollständig in den Warenkorb gelegt wurde, Material inaktiv setzen
		            if (availableStock === newTotalQuantity) {
		                oStockModel.setProperty(oDialog.getBindingContext("StockModel").getPath() + "/isBlass", true);
		            }
		        }
		    });
		
		    // Füge das Material hinzu, wenn es noch nicht im Warenkorb ist
		    if (!bMaterialExists) {
		        var oNewEntry = {
		            Matnr: oSelectedMaterial.Matnr,
		            Maktx: oSelectedMaterial.Maktx,
		            Menge: availableStock,
		            bMenge: quantityValue,
		            Meins: oSelectedMaterial.Meins
		        };
		        aMaterialList.push(oNewEntry);
		        this.getView().getModel("StockModel").setProperty(oSelectedMaterialPath + "/bMenge", quantityValue);
		        // Wenn die gesamte Menge in den Warenkorb gelegt wurde, Material inaktiv setzen
		        if (availableStock === quantityValue) {
		            oStockModel.setProperty(oDialog.getBindingContext("StockModel").getPath() + "/isBlass", true);
		        }
		    }
		
		    oModel.setProperty("/materials", aMaterialList);
		
		    // Aktualisiere das StockModel
		    oStockModel.updateBindings(true);
		
		    // Erfolgsmeldung anzeigen
		    sap.m.MessageToast.show("Material hinzugefügt.");
		
		    // Schließe den Dialog
		    this.oDialog.close();
		},


        // Blasse Materialien darstellen
        stockItemFormatter: function (bIsBlass) {
            return bIsBlass ? "Inactive" : "Active";  // So werden inaktive Materialien z.B. gräulich
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
		        var sSelectedKey = oEvent.getSource().getSelectedKey();
		        var oBtnTransfer = sap.ui.core.Fragment.byId(this.getView().getId(), "btnTransfer");
		        var aMaterials = this.getView().getModel("materialList").getProperty("/materials");
		        var oBtnRmv = sap.ui.core.Fragment.byId(this.getView().getId(), "rmvBtn");
		
		        switch (sSelectedKey) {
		            case "Basket":
		                // Stelle sicher, dass der Button sichtbar ist
		                oBtnTransfer.setVisible(true);
		
		                // Überprüfe die Anzahl der Materialien
		                if (aMaterials && aMaterials.length > 0) {
		                    oBtnTransfer.setEnabled(true);  // Aktivieren, wenn Materialien vorhanden sind
		                } else {
		                    oBtnTransfer.setEnabled(false); // Deaktivieren, wenn keine Materialien vorhanden sind
		                }
		
		                // Aktualisiere die Bindungen der Liste
		                var oList = this.getView().byId("basketList").getBinding("items");
		                oList.getModel().updateBindings(true);
		                oBtnRmv.setVisible(true);
		                break;
		
		            case "FreeStock":
		                // Button im Material-Tab ausblenden
		                oBtnTransfer.setVisible(false);
		                
		                oBtnRmv.setVisible(false);
		                break;
		        }
		    } catch (e) {
		        // Stelle sicher, dass der Button versteckt wird, falls es einen Fehler gibt
		        if (oBtnTransfer) {
		            oBtnTransfer.setVisible(false);
		        }
		        console.error("Fehler im onIconTabPress-Handler", e);
		    }
		},
		cancelTransfer: function() {
		    // Schritt 1: Zurück zur `werkauswahl.view` navigieren
		    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
		    oRouter.navTo("werkauswahl");
		
		    // Schritt 2: Warenkorb leeren (materialList Modell leeren)
		    var oMaterialListModel = this.getView().getModel("materialList");
		    oMaterialListModel.setProperty("/materials", []); // Leeres Array setzt den Warenkorb zurück
		
		    // Schritt 3: Globales Modell leeren
		    var oGlobalModel = this.getView().getModel("globalModel");
		    oGlobalModel.setProperty("/Werks", null); // Leert Werk
		    oGlobalModel.setProperty("/Lgort", null); // Leert Lagerort
		    oGlobalModel.setProperty("/zielWerks", null); // Leert Zielwerk
		    oGlobalModel.setProperty("/zielLgort", null); // Leert Ziel-Lagerort
		    
		    // Optional: Falls du weitere Felder im globalModel hast, die geleert werden sollen, kannst du sie hier hinzufügen.
		    
		    // Zeige eine Nachricht, dass der Transfer abgebrochen wurde
		    sap.m.MessageToast.show("Transfer abgebrochen, Warenkorb geleert.");
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
		},
	transferMaterials: function () {
		    var oMaterialModel = this.getView().getModel("materialList");
		    var aMaterials = oMaterialModel.getProperty("/materials");
		
		    // Überprüfen, ob es Materialien im Warenkorb gibt
		    if (!aMaterials || aMaterials.length === 0) {
		        sap.m.MessageToast.show("Der Warenkorb ist leer.");
		        return;
		    }
		
		    var oGlobalModel = this.getOwnerComponent().getModel("globalModel");
		
		    // Hole Quell- und Zielwerk sowie Lagerort aus dem globalen Modell
		    var oSourceWerks = oGlobalModel.getProperty("/Werks");
		    var oSourceLgort = oGlobalModel.getProperty("/Lgort");
		    var oDestWerks = oGlobalModel.getProperty("/zielWerks");
		    var oDestLgort = oGlobalModel.getProperty("/zielLgort");
		
		    if (!oSourceWerks || !oSourceLgort || !oDestWerks || !oDestLgort) {
		        sap.m.MessageBox.error("Bitte geben Sie sowohl das Quellwerk und den Quell-Lagerort als auch das Zielwerk und den Ziel-Lagerort an.");
		        return;
		    }
		
		    var oBackendModel = this.getView().getModel(); // Backend OData Model
		    var aBatchPromises = []; // Array für Batch-Operationen
		
		    // Iteriere über die Materialien im Warenkorb
		    aMaterials.forEach(function (oMaterial) {
		        var oPayload = {
		            Matnr: oMaterial.Matnr,     // Materialnummer
		            Tmenge: oMaterial.bMenge.toString(),    // Transfermenge
		            Werks: oSourceWerks.substring(0, 4),         // Quellwerk
		            Lgort: oSourceLgort,         // Quell-Lagerort
		            Dwerks: oDestWerks.substring(0, 4),          // Zielwerk
		            Dlgort: oDestLgort,           // Ziel-Lagerort
		            Tart: "Q"
		        };
		
		        // Erstelle ein Promise für jeden Materialtransfer (POST-Anfrage)
		        var oBatchPromise = new Promise(function (resolve, reject) {
		            oBackendModel.create("/transferItemSet", oPayload, {
		                success: function (oData) {
		                    resolve({
		                        success: true,
		                        material: oMaterial.Matnr
		                    });
		                },
		                error: function (oError) {
		                    reject({
		                        success: false,
		                        material: oMaterial.Matnr,
		                        error: oError
		                    });
		                }
		            });
		        });
		
		        aBatchPromises.push(oBatchPromise);
		    });
		
		    // Warte auf alle Batch-Operationen
		    Promise.allSettled(aBatchPromises)
		        .then(function (aResults) {
		            var aSuccessMaterials = [];
		            var aFailedMaterials = [];
		            var aRemainingMaterials = [];
		
		            aResults.forEach(function (oResult) {
		                if (oResult.status === "fulfilled" && oResult.value.success) {
		                    aSuccessMaterials.push(oResult.value.material);
		                } else if (oResult.status === "rejected") {
		                    aFailedMaterials.push(oResult.reason.material);
		                    // Füge fehlgeschlagene Materialien zurück zu den verbleibenden Materialien hinzu
		                    aRemainingMaterials.push(aMaterials.find(function (mat) {
		                        return mat.Matnr === oResult.reason.material;
		                    }));
		                }
		            });
		
		            // Aktualisiere das Materialmodell mit den verbleibenden (fehlgeschlagenen) Materialien
		            oMaterialModel.setProperty("/materials", aRemainingMaterials);
		
		            // Feedback-Nachricht
		            var sMessage = "";
		            if (aSuccessMaterials.length > 0) {
		                sMessage += "Erfolgreich übertragen: " + aSuccessMaterials.join(", ") + ".\n";
		            }
		            if (aFailedMaterials.length > 0) {
		                sMessage += "Fehler bei der Übertragung folgender Materialien: " + aFailedMaterials.join(", ") + ".";
		            }
		
		            sap.m.MessageBox.success(sMessage);
		
		            // Optional: Den Transfer-Button ausblenden, wenn keine Materialien mehr im Warenkorb sind
		            if (aRemainingMaterials.length === 0) {
		                this.getView().byId("btnTransfer").setVisible(false);
		            }
		        }.bind(this))
		        .catch(function (oError) {
		            sap.m.MessageBox.error("Fehler beim Übertragen der Materialien.");
		        });
		}
    });
});