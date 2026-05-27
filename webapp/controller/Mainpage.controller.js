sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox"

], (Controller, JSONModel, Filter, FilterOperator, MessageBox) => {
    "use strict";

    return Controller.extend("sapips.training.casestudygrp1.controller.Mainpage", {

        onInit: function () {
            var oTable = this.byId("ordersTable");
            if (oTable) {
                // Trigger after data is loaded/rendered
                oTable.attachUpdateFinished(this._updateTableTitle.bind(this));
            }

        },

        // Update Table Title
        _updateTableTitle: function () {
            var oTable = this.byId("ordersTable");
            var oBinding = oTable.getBinding("items");

            if (oBinding) {
                var iCount = oBinding.getLength();
                this.byId("tableTitle").setText("Orders (" + iCount + ")");
            }
        },


        // Search / Filter
        onSearch: function () {
            var aFilters = [];

            // Order Number Filter
            var sOrderNumber = this.byId("filterOrderNumber").getValue();
            if (sOrderNumber) {
                aFilters.push(new Filter("OrderNumber", FilterOperator.Contains, sOrderNumber));
            }

            // Creation Date Filter
            var sDate = this.byId("filterCreationDate").getValue();
            if (sDate) {
                aFilters.push(new Filter("CreationDate", FilterOperator.EQ, sDate));
            }

            // Status Filter
            var aSelectedStatus = this.byId("filterStatus").getSelectedKeys();
            if (aSelectedStatus.length > 0) {
                var aStatusFilters = aSelectedStatus.map(function (sKey) {
                    return new Filter("Status", FilterOperator.EQ, sKey);
                });
                aFilters.push(new Filter({ filters: aStatusFilters, and: false }));
            }

            // Apply Filters
            var oTable = this.byId("ordersTable");
            var oBinding = oTable.getBinding("items");
            oBinding.filter(aFilters);

            // Update title
            this._updateTableTitle();
        },

        // Clear Filters
        onClear: function () {
            this.byId("filterOrderNumber").setValue("");
            this.byId("filterCreationDate").setValue("");
            this.byId("filterStatus").setSelectedKeys([]);

            // Remove all filters
            var oTable = this.byId("ordersTable");
            oTable.getBinding("items").filter([]);

            this._updateTableTitle();
        },

        // Navigate to Create Page
        onCreateOrder: function () {
            this.getOwnerComponent().getRouter().navTo("CreatePage");
        },

        // Navigate to Detail Page
        onOrderPress: function (oEvent) {
            var oItem = oEvent.getSource().getParent();

            // Handle if clicked from button or row
            if (!oItem.getBindingContext) {
                oItem = oEvent.getSource().getParent().getParent();
            }

            var oContext = oItem.getBindingContext();
            if (!oContext) {
                oContext = oEvent.getSource().getBindingContext();
            }

            var sPath = oContext.getPath();
            var iIndex = sPath.split("/").pop();

            this.getOwnerComponent().getRouter().navTo("DetailPage", {
                orderIndex: iIndex
            });
        },

        // Delete Order
        onDeleteOrder: function () {
            var oTable = this.byId("ordersTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.error("Please select an item from the table.");
                return;
            }

            MessageBox.confirm("Are you sure you want to delete " + aSelectedItems.length + " item(s)?", {
                onClose: function (sAction) {

                    if (sAction === MessageBox.Action.OK) {
                        var oModel = this.getView().getModel();
                        var aOrders = oModel.getProperty("/Orders");

                        // Get indices to delete (reverse to avoid shifting)
                        var aIndicesToDelete = aSelectedItems.map(function (oItem) {
                            var sPath = oItem.getBindingContext().getPath();
                            return parseInt(sPath.split("/").pop());
                        }).sort(function (a, b) {
                            return b - a;
                        });

                        aIndicesToDelete.forEach(function (iIndex) {
                            aOrders.splice(iIndex, 1);
                        });

                        oModel.setProperty("/Orders", aOrders);

                        this._updateTableTitle();

                        MessageBox.success("Selected order(s) deleted successfully.");
                    }

                }.bind(this)
            });
        }

    });
});
