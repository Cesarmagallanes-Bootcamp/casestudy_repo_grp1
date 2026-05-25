sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
    "use strict";
    return Controller.extend("com.ui5.gr1.casestudy.ordermanagement.controller.DetailPage", {
        onInit: function () {
            var oViewModel = new JSONModel({
                isEditable: false
            });
            this.getView().setModel(oViewModel, "viewModel");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("DetailPage").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function (oEvent) {
            //Store order index for Edit navigation
            var iIndex = oEvent.getParameter("arguments").orderIndex;
            this._iOrderIndex = iIndex;
            this._loadOrderData(iIndex);
        },
        _loadOrderData: function (iIndex) {
            var oModel = this.getOwnerComponent().getModel();
            var oOrder = oModel.getProperty("/Orders/" + iIndex);
            if (!oOrder) {
                return;
            }
            // Map Products
            var aProducts = (oOrder.Products || []).map(function (oProduct) {
                return {
                    ProductCode: oProduct.ProductCode,
                    ProductName: oProduct.ProductName,
                    Quantity: oProduct.Quantity,
                    PricePerQuantity: oProduct.PricePerQuantity,
                    TotalPrice: oProduct.Quantity * oProduct.PricePerQuantity
                }
            });
            // Set Order Detail Fields
            this.byId("orderNumber").setText(oOrder.OrderNumber);
            this.byId("createdOn").setText(oOrder.CreationDate);
            this.byId("receivingPlant").setText(
                oOrder.ReceivingPlant + " - " + oOrder.ReceivingPlantDesc
            );
            this.byId("deliveringPlant").setText(
                oOrder.DeliveringPlant + " - " + oOrder.DeliveringPlantDesc
            );
            // Set Status with State
            var oStatus = this.byId("orderStatus");
            oStatus.setText(oOrder.Status);
            oStatus.setState(this._getStatusState(oOrder.Status));
            // Set Products Model
            var oProductModel = new JSONModel(aProducts);
            this.getView().setModel(oProductModel, "products");
            // Update Product Table Title
            this.byId("productTableTitle").setText("Product (" + aProducts.length + ")");
        },
        // Get Status State
        _getStatusState: function (sStatus) {
            switch (sStatus) {
                case "Created": return "Information";
                case "Released": return "Warning";
                case "Partially Completed": return "Error";
                case "Delivered": return "Success";
                default: return "None";
            }
        },
        onEdit: function () {
            this.getOwnerComponent().getRouter().navTo("EditPage", {
                orderIndex: this._iOrderIndex
            });
        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("MainPage");
        }
    });
});
