'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');

function acceptPayment(res, next) {    
    var HiPayOrderModule = require('*/cartridge/scripts/lib/hipay/modules/hipayOrderModule');
    var HiPayProcess = require('*/cartridge/scripts/lib/hipay/hipayProcess');
    var isHashValid = HiPayProcess.verifyHash();
    var params = {};
    var processOrder;
    var order;
    var error;
    var redirectURL;

    processOrder = HiPayOrderModule.hiPayProcessOrderCall();
    order = processOrder.order;
    error = processOrder.error;

    if (error) {
        if (order === undefined) {
            // Dans Cas Multibanco / Mbway / Sisal            
            res.redirect(URLUtils.url('Home-Show'));
        } else {
            params = {
                order: order,
                hiPayState: error
            };
            redirectURL = HiPayProcess.failOrder(params);
            res.redirect(redirectURL);
        }
    } else if (isHashValid) {
        HiPayProcess.proceedWithOrder(order, res, next);
    } else if (!isHashValid) {
        if (order) {             
            // SANS HashValid : Dans le Cas Multibanco / Mbway / Sisal
            var paymentMethod = order.paymentInstrument.paymentMethod;
            if (paymentMethod.equals('HIPAY_MULTIBANCO') || paymentMethod.equals('HIPAY_MBWAY')  || paymentMethod.equals('HIPAY_SISAL')) {                   
                HiPayProcess.proceedWithOrder(order, res, next);
                return next();
            } else {
                params = {
                    order: order,
                    hiPayState: 'error'
                };
                redirectURL = HiPayProcess.failOrder(params);
                res.redirect(redirectURL);
                return next();
            }              
        } 
        params = {
            order: order,
            hiPayState: 'error'
        };
        redirectURL = HiPayProcess.failOrder(params);
        res.redirect(redirectURL); 
    }
    return next();
}

function declinePayment(req, res, next) {
    var HiPayOrderModule = require('*/cartridge/scripts/lib/hipay/modules/hipayOrderModule');
    var HiPayProcess = require('*/cartridge/scripts/lib/hipay/hipayProcess');
    var isHashValid = HiPayProcess.verifyHash();
    var order = OrderMgr.getOrder(req.querystring.orderid);
    var hiPayState = req.querystring.state;
    var result;

    if (hiPayState !== 'cancel') {
        hiPayState = 'decline';
    }

    if (!isHashValid) {
        res.redirect(URLUtils.url('Home-Show'));
    } else {
        var processOrder = HiPayOrderModule.hiPayProcessOrderCall();

        if (processOrder.error) {
            res.redirect(URLUtils.url('Home-Show'));
        } else {
            order = processOrder.order;
            result = {
                order: order,
                hiPayState: hiPayState
            };

            var redirectURL = HiPayProcess.failOrder(result);
            res.redirect(redirectURL);
        }
    }

    return next();
}

/** Handles HiPay accepted payment */
server.get(
    'Accept',
    server.middleware.https,
    function (req, res, next) {
        acceptPayment(res, next);
    }
);

/** Handles HiPay pending payment */
server.get(
    'Pending',
    server.middleware.https,
    function (req, res, next) {
        acceptPayment(res, next);
    }
);

/** Handles HiPay declined payment */
server.get(
    'Decline',
    server.middleware.https,
    function (req, res, next) {
        declinePayment(req, res, next);
    }
);

/** Handles HiPay cancelled payment */
server.get(
    'Cancel',
    server.middleware.https,
    function (req, res, next) {
        declinePayment(req, res, next);
    }
);

/** Handles HiPay error payment response */
server.get(
    'Error',
    server.middleware.https,
    function (req, res, next) {
        res.render('hipay/order/error');

        return next();
    }
);

module.exports = server.exports();
