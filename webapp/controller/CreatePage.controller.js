
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, MessageBox, MessageToast, SelectDialog, StandardListItem, Filter, FilterOperator, History) {
    "use strict";

    return Controller.extend("sapips.training.casestudygrp1.controller.CreatePage", {
        onInit: function () {
            this._initCreateModel();
            this._sPlantType = null;         // "receiving" | "delivering"
            this._pPlantDialog = null;      
            this._oProductDialog = null;     // SelectDialog instance
            this._aProductBaseFilters = [];  // base filters for product dialog (Delivering Plant)
        },

        //Data declaration for Create Page model with default values
        _initCreateModel: function () {
            const oCreateModel = new JSONModel({
                displayReceivingPlant: "",
                displayDeliveringPlant: "",
                orderReceivingPlantCode: "",
                orderReceivingPlantDesc: "",
                orderDeliveringPlantCode: "",
                orderDeliveringPlantDesc: "",
                creationDate: new Date(),
                status: "Created",
                products: []
            });

            this.getView().setModel(oCreateModel, "createModel");
            this.getView().getModel("createModel").setDefaultBindingMode("TwoWay");
        },
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },
        // Navigation going back to Main Page 
        onNavBack: function () {
            const oHistory = History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();
            const oRouter = this.getOwnerComponent().getRouter();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                oRouter.navTo("MainPage", {}, true);
            }
        },
        // Clearing the Edit Page after saving or cancelling 
        _resetCreateForm: function () {
            const oCreateModel = this.getModel("createModel");

            oCreateModel.setData({
                displayReceivingPlant: "",
                displayDeliveringPlant: "",

                orderReceivingPlantCode: "",
                orderReceivingPlantDesc: "",
                orderDeliveringPlantCode: "",
                orderDeliveringPlantDesc: "",

                creationDate: new Date(),
                status: "Created",
                products: []
            });

            this._resetPlantValueStates();
            this._resetQuantityValueStates();

            const oTable = this.byId("productTable");
            if (oTable) {
                oTable.removeSelections(true);
            }
        },
        // Clearing of Validation Errors from the Receiving and Delivering Plant inputs
        _resetPlantValueStates: function () {
            const oRec = this.byId("receivingPlantInput");
            const oDel = this.byId("deliveringPlantInput");

            if (oRec) {
                oRec.setValueState("None");
                oRec.setValueStateText("");
            }
            if (oDel) {
                oDel.setValueState("None");
                oDel.setValueStateText("");
            }
        },
        //Highlighting missing required fields for plants when trying to add product or save without filling them
        _setMissingPlantStates: function (bReceivingMissing, bDeliveringMissing) {
            const oRec = this.byId("receivingPlantInput");
            const oDel = this.byId("deliveringPlantInput");

            if (bReceivingMissing && oRec) {
                oRec.setValueState("Error");
                oRec.setValueStateText("Receiving Plant is required.");
            }
            if (bDeliveringMissing && oDel) {
                oDel.setValueState("Error");
                oDel.setValueStateText("Delivering Plant is required.");
            }
        },

        // Clears Receiving and Delivering Plant display fields after adding a product to encourage user to reselect plants for next product (if needed) and avoid confusion about which plants are associated with which products
        _clearPlantDisplayFields: function () {
            const oModel = this.getModel("createModel");
            oModel.setProperty("/displayReceivingPlant", "");
            oModel.setProperty("/displayDeliveringPlant", "");
            this._resetPlantValueStates();
        },
        // Remove validation errors from Quantity inputs and reset to default state (called before validating on save and when opening product dialog)
        _resetQuantityValueStates: function () {
            const oTable = this.byId("productTable");
            if (!oTable) return;

            oTable.getItems().forEach((oItem) => {
                const aCells = oItem.getCells();
                const oQtyInput = aCells && aCells[1]; // Quantity cell (Input)
                if (oQtyInput && oQtyInput.setValueState) {
                    oQtyInput.setValueState("None");
                    oQtyInput.setValueStateText("");
                }
            });
        },
        //Highlighting Quantity inputs with errors when trying to save with invalid quantities (empty, non-numeric, or <= 0)
        _highlightInvalidQuantities: function () {
            const oTable = this.byId("productTable");
            if (!oTable) return;

            oTable.getItems().forEach((oItem) => {
                const oCtx = oItem.getBindingContext("createModel");
                if (!oCtx) return;

                const oRow = oCtx.getObject();
                const iQty = Number(oRow.Quantity);

                const oQtyInput = oItem.getCells()[1]; // Quantity Input
                if (!oQtyInput || !oQtyInput.setValueState) return;

                if (!oRow.Quantity || Number.isNaN(iQty) || iQty <= 0) {
                    oQtyInput.setValueState("Error");
                    oQtyInput.setValueStateText("Quantity must be greater than 0.");
                } else {
                    oQtyInput.setValueState("None");
                    oQtyInput.setValueStateText("");
                }
            });
        },
        // Save button with validation for entries in the table 
        _validateForSave: function () {
            const oModel = this.getModel("createModel");
            const sRec = oModel.getProperty("/orderReceivingPlantCode");
            const sDel = oModel.getProperty("/orderDeliveringPlantCode");
            const aProducts = oModel.getProperty("/products") || [];

            this._resetPlantValueStates();
            this._resetQuantityValueStates();

            // Plant Validation entry
            if (!sRec || !sDel) {
                this._setMissingPlantStates(!sRec, !sDel);
                MessageBox.error("Please complete the required fields.");
                return false;
            }
            // At least 1 product must be added to the order
            if (aProducts.length === 0) {
                MessageBox.error("Please add a Product.");
                return false;
            }
            // Quantity Validation > 0, and numeric entries only 
            const bInvalidQty = aProducts.some((p) => {
                const iQty = Number(p.Quantity);
                return !p.Quantity || Number.isNaN(iQty) || iQty <= 0;
            });

            if (bInvalidQty) {
                this._highlightInvalidQuantities();
                MessageBox.error("Quantity must be greater than 0.");
                return false;
            }

            return true;
        },
        // Plant field dialog for help
        onOpenReceivingPlantDialog: function () {
            this._sPlantType = "receiving";
            this._openPlantDialog("Select Receiving Plant");
        },
        onOpenDeliveringPlantDialog: function () {
            this._sPlantType = "delivering";
            this._openPlantDialog("Select Delivering Plant");
        },
        _openPlantDialog: function (sTitle) {
            if (!this._pPlantDialog) {
                this._pPlantDialog = this.loadFragment({
                    name: "sapips.training.casestudygrp1.fragment.PlantDialog"
                });
            }

            this._pPlantDialog.then(function (oDialog) {
                oDialog.setTitle(sTitle);

                const oBinding = oDialog.getBinding("items");
                if (oBinding) oBinding.filter([]);

                oDialog.open();
            });
        },
        onPlantSearch: function (oEvent) {
            const sValue = oEvent.getParameter("value") || "";
            const oDialog = oEvent.getSource();

            const oFilter = new Filter({
                filters: [
                    new Filter("PlantCode", FilterOperator.Contains, sValue),
                    new Filter("PlantDescription", FilterOperator.Contains, sValue)
                ],
                and: false
            });

            oDialog.getBinding("items").filter([oFilter]);
        },
        onPlantConfirm: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) return;

            const sCode = oItem.getTitle();
            const sDesc = oItem.getDescription();
            const sDisplay = sCode + " - " + sDesc;

            const oModel = this.getModel("createModel");

            if (this._sPlantType === "receiving") {
                oModel.setProperty("/orderReceivingPlantCode", sCode);
                oModel.setProperty("/orderReceivingPlantDesc", sDesc);
                oModel.setProperty("/displayReceivingPlant", sDisplay);
            } else if (this._sPlantType === "delivering") {
                oModel.setProperty("/orderDeliveringPlantCode", sCode);
                oModel.setProperty("/orderDeliveringPlantDesc", sDesc);
                oModel.setProperty("/displayDeliveringPlant", sDisplay);
            }

            this._resetPlantValueStates();

            const oDialog = oEvent.getSource();
            const oBinding = oDialog.getBinding("items");
            if (oBinding) oBinding.filter([]);
        },

        onPlantCancel: function (oEvent) {
            const oDialog = oEvent.getSource();
            const oBinding = oDialog.getBinding("items");
            if (oBinding) oBinding.filter([]);
        },
        // Product select dialog will only show products that are allowed for the selected Delivering Plant based on the mapping list (if provided). If no mapping or no allowed products for plant, all products will be shown.
        _getAllowedProductCodesForPlant: function (sPlantCode) {
            const oMainModel = this.getOwnerComponent().getModel();
            const aMap = oMainModel.getProperty("/ProductPlantMap") || [];
            return aMap
                .filter(m => m.PlantCode === sPlantCode)
                .map(m => m.ProductCode);
        },
        // Binding selected products to the table and applying filters based on Delivering Plant selection
        _openProductDialog: function () {
            if (!this._oProductDialog) {
                this._oProductDialog = new SelectDialog({
                    title: "Select Product",
                    multiSelect: false,
                    liveChange: this.onProductSearch.bind(this),
                    search: this.onProductSearch.bind(this),
                    confirm: this.onProductConfirm.bind(this),
                    cancel: this.onProductCancel.bind(this)
                });

                this.getView().addDependent(this._oProductDialog);

                this._oProductDialog.bindAggregation("items", {
                    path: "/Products",
                    template: new StandardListItem({
                        title: "{ProductName}",
                        description: "{ProductCode}"
                    })
                });
            }

            const sPlantCode = this.getModel("createModel").getProperty("/orderDeliveringPlantCode");
            const aFilters = [];

            const aAllowedCodes = this._getAllowedProductCodesForPlant(sPlantCode);
            const aMap = this.getOwnerComponent().getModel().getProperty("/ProductPlantMap") || [];

            // strict: if mapping exists but no allowed products for plant
            if (aMap.length > 0 && aAllowedCodes.length === 0) {
                MessageBox.error("No available products found for the selected Delivering Plant.");
                return;
            }

            if (aAllowedCodes.length > 0) {
                const aCodeFilters = aAllowedCodes.map(code =>
                    new Filter("ProductCode", FilterOperator.EQ, code)
                );
                aFilters.push(new Filter({ filters: aCodeFilters, and: false }));
            }

            this._aProductBaseFilters = aFilters;
            this._oProductDialog.getBinding("items").filter(aFilters);
            this._oProductDialog.open();
        },
        // Add product only when both Receiving and Delivering Plants have valid entries
        onAddProduct: function () {
            const oModel = this.getModel("createModel");
            const sDisplayRec = oModel.getProperty("/displayReceivingPlant");
            const sDisplayDel = oModel.getProperty("/displayDeliveringPlant");

            this._resetPlantValueStates();

            if (!sDisplayRec || !sDisplayDel) {
                this._setMissingPlantStates(!sDisplayRec, !sDisplayDel);
                MessageBox.error("Please complete the required fields.");
                return;
            }

            this._openProductDialog();
        },
        //Product selection build up based from the input in the search field and filtered based on the Delivering Plant selection
        onProductSearch: function (oEvent) {
            const sValue = oEvent.getParameter("value") || "";
            const oBinding = oEvent.getSource().getBinding("items");

            const oSearchFilter = new Filter({
                filters: [
                    new Filter("ProductName", FilterOperator.Contains, sValue),
                    new Filter("ProductCode", FilterOperator.Contains, sValue)
                ],
                and: false
            });

            const aBase = this._aProductBaseFilters || [];
            const aFinal = aBase.length > 0
                ? [new Filter({
                    filters: [new Filter({ filters: aBase, and: true }), oSearchFilter],
                    and: true
                })]
                : [oSearchFilter];

            oBinding.filter(aFinal);
        },
        // Adds the selected product in the table with validation for duplicate enries with default values
        onProductConfirm: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) return;

            const oProd = oItem.getBindingContext().getObject();
            const oCreateModel = this.getModel("createModel");
            const aItems = oCreateModel.getProperty("/products") || [];

            const bExists = aItems.some(p => p.ProductCode === oProd.ProductCode);
            if (bExists) {
                MessageBox.error("Product is already added.");
                return;
            }

            aItems.push({
                ProductCode: oProd.ProductCode,
                ProductName: oProd.ProductName,
                Quantity: 1,
                PricePerQuantity: oProd.PricePerQuantity,
                TotalPrice: 1 * oProd.PricePerQuantity
            });

            oCreateModel.setProperty("/products", aItems);

            // added a function that will clear the Receiving and Delivering Plants after adding it to the table
            this._clearPlantDisplayFields();
        },
        onProductCancel: function () {
        },
        // Quantity validation if an entry is a non 0 value
        onQuantityValidate: function (oEvent) {
            const oInput = oEvent.getSource();
            let sValue = oInput.getValue();
            const bNumeric = /^[0-9]*$/.test(sValue);
            if (!bNumeric) {
                MessageToast.show("Please input numeric values only.");
                sValue = sValue.replace(/[^0-9]/g, "");
                oInput.setValue(sValue);
                oInput.setValueState("Error");
                oInput.setValueStateText("Only numbers are allowed.");
                return;
            }
            if (sValue === "" || Number(sValue) === 0) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Entry must be greater than 0.");
                return;
            }
            //calculates the total price based on the entry on quantity
            oInput.setValueState("None");
            oInput.setValueStateText("");

            const oCtx = oInput.getBindingContext("createModel");
            if (!oCtx) return;

            const sPath = oCtx.getPath();
            const iQuantity = Number(sValue) || 0;
            const iPrice = Number(this.getModel("createModel").getProperty(sPath + "/PricePerQuantity")) || 0;

            this.getModel("createModel").setProperty(sPath + "/Quantity", iQuantity);
            this.getModel("createModel").setProperty(sPath + "/TotalPrice", iQuantity * iPrice);
        },
        // Delete product from the table with confirmation and error handling for no selection
        onDeleteProduct: function () {
            const oTable = this.byId("productTable");
            const aSelected = oTable.getSelectedItems();
            if (aSelected.length === 0) {
                MessageBox.error("Please select an item from the table");
                return;
            }
            MessageBox.confirm(`Are you sure you want to delete ${aSelected.length} item(s)?`, {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.YES) return;
                    let aProducts = this.getModel("createModel").getProperty("/products") || [];
                    aSelected.forEach((oSel) => {
                        const oObj = oSel.getBindingContext("createModel").getObject();
                        aProducts = aProducts.filter(p => p !== oObj);
                    });
                    this.getModel("createModel").setProperty("/products", aProducts);
                    oTable.removeSelections(true);
                }
            });
        },
        // Save button and validation for quantity entry and if an entry is made in the table
        onSave: function () {
            if (!this._validateForSave()) return;
            MessageBox.confirm("Are you sure you want to Save these changes?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.YES) return;
                    const oData = this.getModel("createModel").getData();
                    const sOrderNo = this._generateOrderNumber();
                    const oMainModel = this.getOwnerComponent().getModel();
                    const aOrders = oMainModel.getProperty("/Orders") || [];
                    aOrders.unshift({
                        OrderNumber: sOrderNo,
                        CreationDate: this._formatDate(oData.creationDate),
                        ReceivingPlant: oData.orderReceivingPlantCode,
                        ReceivingPlantDesc: oData.orderReceivingPlantDesc,
                        DeliveringPlant: oData.orderDeliveringPlantCode,
                        DeliveringPlantDesc: oData.orderDeliveringPlantDesc,
                        // Default status when creating a new order
                        Status: "Created",
                        Products: (oData.products || []).map(p => ({
                            ProductCode: p.ProductCode,
                            ProductName: p.ProductName,
                            Quantity: p.Quantity,
                            PricePerQuantity: p.PricePerQuantity
                        }))
                    });
                    oMainModel.setProperty("/Orders", aOrders);
                    MessageBox.success(`The Order ${sOrderNo} has been successfully created.`, {
                        onClose: () => {
                            this._resetCreateForm();
                            this.getOwnerComponent().getRouter().navTo("MainPage");
                        }
                    });
                }
            });
        },
        // Cancel Button with the stopper
        onCancel: function () {
            MessageBox.confirm("Are you sure you want to cancel the changes done in the page?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                emphasizedAction: MessageBox.Action.YES,
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.YES) {
                        this._resetCreateForm();
                        this.getOwnerComponent().getRouter().navTo("MainPage");
                    }
                }
            });
        },
        //Date Formatter to match the required format in the Main Page table and details page
        _formatDate: function (vDate) {
            const oDate = vDate instanceof Date ? vDate : new Date(vDate);
            const yyyy = oDate.getFullYear();
            const mm = String(oDate.getMonth() + 1).padStart(2, "0");
            const dd = String(oDate.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
        },

        //Generates a random 6 digit number
        _generateOrderNumber: function () {
            return String(Math.floor(120000 + Math.random() * 899999));
        },
        // clearing the dialogs when exiting the Create Page to avoid issues with multiple instances and stale data when opening the dialogs again
        onExit: function () {
            if (this._pPlantDialog) {
                this._pPlantDialog.then(function (oDialog) {
                    oDialog.destroy();
                });
            }
            if (this._oProductDialog) {
                this._oProductDialog.destroy();
                this._oProductDialog = null;
            }
        }
    });
});
