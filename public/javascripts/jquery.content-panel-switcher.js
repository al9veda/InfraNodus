/* jQuery Content Panel Switcher JS - v1.1 */
var jcps = {};
jcps.fader = function(speed, target, panel) {
	jcps.show(target, panel);
    if (panel == null) {panel = ''};
	$('.switcher' + panel).click(function() {
		var _contentId = '#' + $(this).attr('id') + '-content';
		var _content = $(_contentId).html();
		if (speed == 0) {
			$(target).html(_content);
		}
		else {	
			$(target).fadeToggle(speed, function(){$(this).html(_content);}).fadeToggle(speed);
		}
	});
};
jcps.slider = function(speed, target, panel) { 
	jcps.show(target, panel);
    if (panel == null) {panel = ''};
	$('.switcher' + panel).click(function() {
		var _contentId = '#' + $(this).attr('id') + '-content';
		var _content = $(_contentId).html();
		if (speed == 0) {
			$(target).html(_content);
		}
		else {	
			$(target).slideToggle(speed, function(){$(this).html(_content);}).slideToggle(speed);
		}
	});
};
jcps.show = function (target, panel) {
$('.show').each(function() {
	if (panel == null) {
		$(target).append($(this).html() + '<br/>');
	}
	else {
		var trimPanel = panel.replace('.', '');
		if ($(this).hasClass(trimPanel) == true){$(target).append($(this).html() + '<br/>');}
	}
});
}

