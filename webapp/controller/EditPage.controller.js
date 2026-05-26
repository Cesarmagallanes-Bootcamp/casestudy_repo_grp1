
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("sapips.training.casestudygrp1.controller.EditPage", {

        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("EditPage").attachPatternMatched(this._onRouteMatched, this);
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
        // Calculates price per quaantity 
        calculateTotal: function (qty, price) {
            qty = Number(qty);
            price = Number(price);
            if (!qty || !price) {
                return 0;
            }
            return qty * price;
        },
        // Saving the changes and navigating back to the Detail Page
        onSave: function () {
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
        //Not part of the requirement but added a functionality to add new products to the table for better user experience
        onAddProduct: function () {
        var oModel = this.getView().getModel("products");
        var aData = oModel.getData();
         if (!Array.isArray(aData)) {
         aData = [];
      }
        var oNewProduct = {
        ProductName: "New Product",
        Quantity: 1,
        PricePerQuantity: 0
        };
        aData.push(oNewProduct);
        oModel.setData(aData);
        }
    });
});
