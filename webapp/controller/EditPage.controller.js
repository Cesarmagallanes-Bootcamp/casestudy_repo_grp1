
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast"


], function (Controller, JSONModel, MessageBox,SelectDialog, StandardListItem, Filter, FilterOperator, MessageToast) {
    "use strict";

    return Controller.extend("sapips.training.casestudygrp1.controller.EditPage", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("EditPage").attachPatternMatched(this._onRouteMatched, this);
            this._oProductDialog = null;
        },
        // Routing to the Edit Page
        _onRouteMatched: function (oEvent) {
            var iIndex = oEvent.getParameter("arguments").orderIndex;
            this._iOrderIndex = iIndex;

            var oModel = this.getOwnerComponent().getModel();
            var oOrder = oModel.getProperty("/Orders/" + iIndex);

            if (!oOrder) {
                return;
            }

            var oOrderCopy = JSON.parse(JSON.stringify(oOrder));

            this.getView().setModel(new JSONModel(oOrderCopy), "editModel");
            this.getView().setModel(new JSONModel(oOrderCopy.Products || []), "products");
        },
        // Navigation back to the Detail Page without saving changes
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("DetailPage", {
                orderIndex: this._iOrderIndex
            });
        },
        // Calculates price per quantity 
        calculateTotal: function (qty, price) {
            qty = Number(qty);
            price = Number(price);
            if (!qty || !price) {
                return 0;
            }
            return (qty * price);
        },
        // Saving the changes and navigating back to the Detail Page
        onSave: function () {
            if (!this._validateBeforeSave()) {
                return;
            }
            var that = this;
            // Confrimation pop up before saving
            MessageBox.confirm(
                "Are you sure you want to Save these changes?",
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {
                        if (oAction !== MessageBox.Action.YES) {
                            return;
                        }

                        var oMainModel = that.getOwnerComponent().getModel();
                        var iIndex = that._iOrderIndex;

                        var oUpdatedData = that.getView().getModel("editModel").getData();
                        var aProducts = that.getView().getModel("products").getData();

                        oUpdatedData.Products = aProducts;

                        oMainModel.setProperty("/Orders/" + iIndex, oUpdatedData);

                        MessageBox.success(
                            "The Order " + oUpdatedData.OrderNumber + " has been successfully updated.",
                            {
                                onClose: function () {
                                    that.getOwnerComponent().getRouter().navTo("DetailPage", {
                                        orderIndex: iIndex
                                    });
                                }
                            }
                        );
                    }
                }
            );
        },
        // Deleting selected products from the table
        onDelete: function () {
            var oTable = this.byId("productMainTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.error("Please select at least one product to delete.");
                return;
            }

            var that = this;

            // Confirmation message pop up before deleting the products from the table
            MessageBox.confirm(
                "Are you sure you want to delete " + aSelectedItems.length + " selected product(s)?",
                {
                    actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                    onClose: function (oAction) {

                        if (oAction === MessageBox.Action.YES) {

                            var oModel = that.getView().getModel("products");
                            var aData = oModel.getData();

                            var aIndexes = [];

                            aSelectedItems.forEach(function (oItem) {
                                var iIndex = parseInt(
                                    oItem.getBindingContext("products").getPath().split("/").pop(),
                                    10
                                );
                                aIndexes.push(iIndex);
                            });
                            aIndexes.sort(function (a, b) {
                                return b - a;
                            });
                            aIndexes.forEach(function (iIndex) {
                                aData.splice(iIndex, 1);
                            });
                            oModel.setData(aData);

                            that._updateProductTitle();
                        }
                    }
                }
            );
        }, 
        //Canceling the changes and navigating back to the Detail Page
        onCancel: function () {
         var that = this;
        // Confirmation messaage pop up before canceling the changes and navigating back to the Detail Page
         MessageBox.confirm(
        "Are you sure you want to cancel the changes done in the page?",
        {
            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
            onClose: function (oAction) {
                if (oAction === MessageBox.Action.YES) {
                    that.getOwnerComponent().getRouter().navTo("DetailPage", {
                        orderIndex: that._iOrderIndex
                    });
                     }
                }
         }
            );
        },
        //Calculating the total price live as th user changes the entry
        
        onQuantityLiveChange: function (oEvent) {
         var oInput = oEvent.getSource();
         var sValue = (oInput.getValue() || "").trim();

         // highlight empty / invalid quantity
         var iQty = Number(sValue);

         if (!sValue || Number.isNaN(iQty) || iQty <= 0) {
             oInput.setValueState("Error");
            oInput.setValueStateText("Entry must be a number greater than 0.");
         } else {
             oInput.setValueState("None");
          oInput.setValueStateText("");
         }
         var oCtx = oInput.getBindingContext("products");
         if (!oCtx) return;
            var sPath = oCtx.getPath();
             var oModel = this.getView().getModel("products");
             oModel.setProperty(sPath + "/Quantity", Number.isNaN(iQty) ? 0 : iQty);
             oModel.refresh(true);
        },

        //Not part of the requirement but added a functionality to add new products to the table for better user experience
        onAddProduct: function () {
            this._openProductDialog();
        },
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
            
                var oBinding = this._oProductDialog.getBinding("items");
                    if (oBinding) {
                        oBinding.filter([]);
                    }
            this._oProductDialog.open();
        },
        
        onProductSearch: function (oEvent) {
        var sValue = oEvent.getParameter("value") || "";
         var oBinding = oEvent.getSource().getBinding("items");
        if (!oBinding) return;

         if (!sValue) {
        oBinding.filter([]);
        return;
         }
          var oFilter = new Filter({
        filters: [
            new Filter("ProductName", FilterOperator.Contains, sValue),
            new Filter("ProductCode", FilterOperator.Contains, sValue)
        ],
        and: false
          });
          oBinding.filter([oFilter]);
        },
        onProductConfirm: function (oEvent) {
         var oItem = oEvent.getParameter("selectedItem");
        if (!oItem) return;

        // default model provides /Products
          var oProd = oItem.getBindingContext().getObject();

          var oProductsModel = this.getView().getModel("products");
          var aProducts = oProductsModel.getData() || [];

         // duplicate check
         var bExists = aProducts.some(function (p) {
        return p.ProductCode === oProd.ProductCode;
         });
         if (bExists) {
        MessageBox.error("Product is already added.");
        return;
         }

          aProducts.push({
        ProductCode: oProd.ProductCode,
        ProductName: oProd.ProductName,
        Quantity: 1,
        PricePerQuantity: oProd.PricePerQuantity
          });

         oProductsModel.setData(aProducts);
         oProductsModel.refresh(true); 
         this._updateProductTitle();
         MessageToast.show("Product added.");
        },

        onProductCancel: function () {
         // no action made
        },
        //dynamic function on the Product header
        _updateProductTitle: function () {
            var aProducts = this.getView().getModel("products").getData() || [];
              var sText = aProducts.length === 1
                  ? "Product (1)"
                 : "Products (" + aProducts.length + ")";
            this.byId("productHeaderTableTitle").setText(sText);
        },
        // Table validation before Saving
        _validateBeforeSave: function () {
            var oModel = this.getView().getModel("products"); 
            var aProducts = oModel.getData() || [];
            if (aProducts.length === 0) {
            MessageBox.error("Please add at least one product before saving.");
            return false;
              }
                 var bInvalid = aProducts.some(function (p) {
                 return !p.Quantity || Number(p.Quantity) <= 0; 
              });
             if (bInvalid) {
             MessageBox.error("Quantity must be greater than 0.");
                return false;
                }
             return true;

        }
    });
});
