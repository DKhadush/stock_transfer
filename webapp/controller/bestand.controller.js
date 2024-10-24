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
			 // Setze den Entfernen-Button unsichtbar
		    if (!this.oDialog) {
			    sap.ui.core.Fragment.load({
			        id: oView.getId(),  
			        name: "com.mindsquare.stock.transfer.view.fragments.addMaterial",  
			        controller: this 
			    }).then(function (oDialog) {
			    	 // Setze den Entfernen-Button unsichtbar
			        var oBtnRemove = sap.ui.core.Fragment.byId(oView.getId(), "rmvBtn");
			        oBtnRemove.setVisible(false);
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
			    var oBtnRemove = sap.ui.core.Fragment.byId(oView.getId(), "rmvBtn");
			    oBtnRemove.setVisible(false);
			    this.oDialog.open();
			}
		},
		
		onBasketMaterialPressEvent: function (oEvent) {
		    var oView = this.getView();
		    var oSelectedItem = oEvent.getSource();
		    
		    // Hole den Kontext des ausgewählten Elements im materialList-Modell
		    var oContext = oSelectedItem.getBindingContext("materialList");
		    var oMaterial = oContext.getObject();
		    var sMatnr = oMaterial.Matnr;
		
		    // Hole das StockModel und die Liste der Materialien darin
		    var oStockModel = this.getView().getModel("StockModel");
		    var aStockMaterials = oStockModel.getProperty("/"); // Annahme: Die Materialliste ist an der Wurzel des Modells
		
		    // Finde das Material im StockModel basierend auf der Materialnummer
		    var iIndex = aStockMaterials.findIndex(function(oStockMaterial) {
		        return oStockMaterial.Matnr === sMatnr;
		    });
		
		    // Falls das Material im StockModel gefunden wurde
		    if (iIndex !== -1) {
		        var sStockPath = "/" + iIndex;  // Der Pfad zum Material im StockModel
		
		        // Wenn der Dialog bereits existiert, zerstöre ihn, um das Binding neu zu setzen
		        if (this.oDialog) {
		            this.oDialog.destroy();
		            this.oDialog = null;
		        }
		
		        // Lade den Dialog und binde das korrekte Material aus dem StockModel
		        sap.ui.core.Fragment.load({
		            id: oView.getId(),
		            name: "com.mindsquare.stock.transfer.view.fragments.addMaterial",  // Verwende das vorhandene Fragment
		            controller: this
		        }).then(function (oDialog) {
		            this.oDialog = oDialog;
		            oView.addDependent(this.oDialog);
		
		            // Binde den Dialog an das gefundene Material im StockModel
		            this.oDialog.bindElement({
		                path: sStockPath,
		                model: "StockModel"
		            });
					 // Binde zusätzlich den Dialog an den Kontext des materials im materialList Modell
            this.oDialog.bindElement({
                path: oContext.getPath(),
                model: "materialList"
            });
		            // Setze den Entfernen-Button auf sichtbar, da der Dialog aus dem Warenkorb geöffnet wird
		            var oBtnRemove = sap.ui.core.Fragment.byId(oView.getId(), "rmvBtn");
		            oBtnRemove.setVisible(true);
		            this.oDialog.open();
		        }.bind(this)).catch(function (error) {
		            console.error("Error loading fragment:", error);
		        });
		    } else {
		        sap.m.MessageToast.show("Material nicht im Bestand gefunden.");
		    }
		},
		
		onRemoveMaterialPress: function () {
		    var oModel = this.getView().getModel("materialList");
		    
		    // Überprüfe, ob der Dialog eine Bindung hat
		    var oDialogContext = this.oDialog.getBindingContext("materialList");
		    
		    if (!oDialogContext) {
		        console.error("Kein gültiger Bindungskontext für das materialList-Modell gefunden.");
		        return;
		    }
		    
		    var sPath = oDialogContext.getPath();  // Hole den Pfad des ausgewählten Materials
		    
		    // Entferne das Material aus der Liste
		    var aMaterials = oModel.getProperty("/materials");
		    var removedMaterial = aMaterials.splice(parseInt(sPath.split("/")[2]), 1)[0];  // Entfernt das Material aus dem Array
		    oModel.setProperty("/materials", aMaterials);
		    
		    // Überprüfe, ob der Warenkorb leer ist, und blende den Button zum Senden aus
		    if (aMaterials.length === 0) {
		        this.getView().byId("btnTransfer").setVisible(false);
		    }
		
		    // Aktualisiere das StockModel und erhöhe die Menge im Lagerbestand
		    var oStockModel = this.getView().getModel("StockModel");
		    var aStockMaterials = oStockModel.getProperty("/"); // Annahme: Materialliste im StockModel
		
		    var iIndex = aStockMaterials.findIndex(function(oStockMaterial) {
		        return oStockMaterial.Matnr === removedMaterial.Matnr;
		    });
		
		    if (iIndex !== -1) {
		        var oStockMaterial = aStockMaterials[iIndex];
		        // Erhöhe die Menge im StockModel um die entfernte Menge
		        oStockMaterial.bMenge -= removedMaterial.bMenge;
		
		        // Falls das Material nicht mehr im Warenkorb ist, setze es wieder auf aktiv (falls deaktiviert)
		        if (oStockMaterial.isBlass) {
		            oStockMaterial.isBlass = false;
		        }
		
		        // Setze die aktualisierte Menge im StockModel
		        oStockModel.setProperty("/" + iIndex + "/bMenge", oStockMaterial.bMenge);
		        oStockModel.setProperty("/" + iIndex + "/isBlass", oStockMaterial.isBlass);
		    }
		
		    oStockModel.updateBindings(true); // Aktualisiere die Bindungen des StockModels
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
		        var oBtnEmpty = sap.ui.core.Fragment.byId(this.getView().getId(), "btnEmpty");
		        var aMaterials = this.getView().getModel("materialList").getProperty("/materials");
		        var oBtnRemove = sap.ui.core.Fragment.byId(this.getView().getId(), "rmvBtn");  // Verwende this.getView()
		
		        switch (sSelectedKey) {
		            case "Basket":
		                // Stelle sicher, dass der Button sichtbar ist
		                oBtnTransfer.setVisible(true);
						oBtnEmpty.setVisible(true);
		                // Überprüfe die Anzahl der Materialien
		                if (aMaterials && aMaterials.length > 0) {
		                    oBtnTransfer.setEnabled(true);  // Aktivieren, wenn Materialien vorhanden sind
		                    oBtnEmpty.setEnabled(true);
		                } else {
		                    oBtnTransfer.setEnabled(false); // Deaktivieren, wenn keine Materialien vorhanden sind
		                    oBtnEmpty.setEnabled(false);
		                }
		
		                // Aktualisiere die Bindungen der Liste
		                var oList = this.getView().byId("basketList").getBinding("items");
		                oList.getModel().updateBindings(true);
		                break;
		
		            case "FreeStock":
		                // Button im Material-Tab ausblenden
		                oBtnTransfer.setVisible(false);
		                oBtnRemove.setVisible(false);  // Button auch ausblenden
		                oBtnEmpty.setVisible(false);
		                break;
		        }
		    } catch (e) {
		        // Stelle sicher, dass der Button versteckt wird, falls es einen Fehler gibt
		        if (oBtnTransfer) {
		            oBtnTransfer.setVisible(false);
		        }
		        if (oBtnEmpty) {
		            oBtnEmpty.setVisible(false);
		        }
		        console.error("Fehler im onIconTabPress-Handler", e);
		    }
		},

		emptyBasket: function () {
		    var oMaterialListModel = this.getView().getModel("materialList");
		    var aMaterials = oMaterialListModel.getProperty("/materials");
		    
		    // Wenn der Warenkorb leer ist, nichts tun
		    if (!aMaterials || aMaterials.length === 0) {
		        sap.m.MessageToast.show("Der Warenkorb ist bereits leer.");
		        return;
		    }
		
		    // 1. Aktualisiere das StockModel: Setze die Mengen zurück
		    var oStockModel = this.getView().getModel("StockModel");
		    var aStockMaterials = oStockModel.getProperty("/");
		
		    // Durchlaufe die Materialien im Warenkorb und aktualisiere das StockModel
		    aMaterials.forEach(function (oMaterial) {
		        var iIndex = aStockMaterials.findIndex(function (oStockMaterial) {
		            return oStockMaterial.Matnr === oMaterial.Matnr;
		        });
		
		        if (iIndex !== -1) {
		            // Aktualisiere die Menge im StockModel, indem die Warenkorbmenge abgezogen wird
		            var oStockMaterial = aStockMaterials[iIndex];
		            oStockMaterial.bMenge -= oMaterial.bMenge;
		
		            // Falls der Bestand vollständig im Warenkorb war, reaktiviere das Material
		            if (oStockMaterial.isBlass) {
		                oStockMaterial.isBlass = false;
		            }
		
		            // Aktualisiere die geänderten Werte im StockModel
		            oStockModel.setProperty("/" + iIndex + "/bMenge", oStockMaterial.bMenge);
		            oStockModel.setProperty("/" + iIndex + "/isBlass", oStockMaterial.isBlass);
		        }
		    });
		
		    // 2. Leere den Warenkorb (materialList)
		    oMaterialListModel.setProperty("/materials", []);
		
		    // 3. Aktualisiere die Bindungen des StockModels und des Warenkorbs
		    oStockModel.updateBindings(true);
		    oMaterialListModel.updateBindings(true);
		
		    // Optional: Den Transfer-Button ausblenden, wenn keine Materialien mehr im Warenkorb sind
		    this.getView().byId("btnTransfer").setVisible(false);
		
		    // Erfolgsmeldung anzeigen
		    sap.m.MessageToast.show("Warenkorb geleert.");
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
		
		embpyBasket: function() {
		    var oMaterialListModel = this.getView().getModel("materialList");
		    oMaterialListModel.setProperty("/materials", []); // Leeres Array setzt den Warenkorb zurück
		
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

    // Check if there are materials in the cart
    if (!aMaterials || aMaterials.length === 0) {
        sap.m.MessageToast.show("Der Warenkorb ist leer.");
        return;
    }

    var oGlobalModel = this.getOwnerComponent().getModel("globalModel");

    // Get source and destination plant and storage location from the global model
    var oSourceWerks = oGlobalModel.getProperty("/Werks");
    var oSourceLgort = oGlobalModel.getProperty("/Lgort");
    var oDestWerks = oGlobalModel.getProperty("/zielWerks");
    var oDestLgort = oGlobalModel.getProperty("/zielLgort");

    if (!oSourceWerks || !oSourceLgort || !oDestWerks || !oDestLgort) {
        sap.m.MessageBox.error("Bitte geben Sie sowohl das Quellwerk und den Quell-Lagerort als auch das Zielwerk und den Ziel-Lagerort an.");
        return;
    }

    var oBackendModel = this.getView().getModel(); // Backend OData Model
    var aBatchPromises = []; // Array for batch operations

    // Iterate over the materials in the cart
    aMaterials.forEach(function (oMaterial) {
        var oPayload = {
            Matnr: oMaterial.Matnr,      // Material number
            Tmenge: oMaterial.bMenge.toString(), // Transfer quantity
            Werks: oSourceWerks.substring(0, 4),   // Source plant
            Lgort: oSourceLgort,         // Source storage location
            Dwerks: oDestWerks.substring(0, 4),    // Destination plant
            Dlgort: oDestLgort,          // Destination storage location
            Tart: "Q"                    // Transfer type (Umlagerung)
        };

        // Create a Promise for each material transfer (POST request)
        var oBatchPromise = new Promise(function (resolve, reject) {
            oBackendModel.create("/transferItemSet", oPayload, {
                success: function (oData) {
                    // Check if the msg field is filled (indicating an error in the backend)
                    if (oData.Msg && oData.Msg !== '') {
                        reject({
                            success: false,
                            material: oMaterial.Matnr,
                            message: oData.Msg // Use the backend error message
                        });
                    } else {
                        resolve({
                            success: true,
                            material: oMaterial.Matnr,
                            message: "Erfolgreich übertragen"
                        });
                    }
                },
                error: function (oError) {
                    reject({
                        success: false,
                        material: oMaterial.Matnr,
                        message: oError.responseText || "Fehler beim Übertragen"
                    });
                }
            });
        });

        aBatchPromises.push(oBatchPromise);
    });

    // Wait for all batch operations to complete
    Promise.allSettled(aBatchPromises)
        .then(function (aResults) {
            var sMessage = '';
            var aRemainingMaterials = [];

            aResults.forEach(function (oResult) {
                if (oResult.status === "fulfilled" && oResult.value.success) {
                    // Log success materials for debugging
                    console.log("Success Material:", oResult.value.material);
                    sMessage += "Material: " + oResult.value.material + " - " + oResult.value.message + "\n";
                } else if (oResult.status === "rejected") {
                    // Log failed materials for debugging
                    console.log("Failed Material:", oResult.reason.material);
                    sMessage += "Fehler bei Material: " + oResult.reason.material + " - " + oResult.reason.message + "\n";
                    // Add failed materials back to the remaining list
                    aRemainingMaterials.push(aMaterials.find(function (mat) {
                        return mat.Matnr === oResult.reason.material;
                    }));
                }
            });

            // Update the material model with remaining materials (failed ones)
            oMaterialModel.setProperty("/materials", aRemainingMaterials);

            // Show feedback message
            if (sMessage) {
                sap.m.MessageBox.show(sMessage, {
                    title: "Umlagerungsübersicht",
                    icon: sap.m.MessageBox.Icon.NONE // No icon
                });
            }
            // Hide the transfer button if no materials are left in the cart
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