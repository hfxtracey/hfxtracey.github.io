/* global $j*/
'use strict';

var helpLinksMenu = {
    init: function() {
        if($j('#btnHelp').length > 0) {
            document.getElementById('btnHelp').addEventListener('click', helpLinksMenu.showExpandedHelp);
        }
    },
    showExpandedHelp: function(event) {
        if ($j('#btnHelpPlusCompliance').hasClass('concealed')) {
            $j('#btnHelpPlusCompliance').removeClass('concealed');
            document.addEventListener('click', (event) => helpLinksMenu.closeHelp(event), true);
            document.getElementById('btnHelp').removeEventListener('click', helpLinksMenu.showExpandedHelp);
        }

    },
    closeHelp: function(event) {
        if (!$j('#btnHelpPlusCompliance').hasClass('concealed')) {
            $j('#btnHelpPlusCompliance').addClass('concealed');
            document.removeEventListener('click', (event) => helpLinksMenu.closeHelp(event), true);
            document.getElementById('btnHelp').addEventListener('click', helpLinksMenu.showExpandedHelp);
        }
    }
};
$j(document).ready(helpLinksMenu.init);
