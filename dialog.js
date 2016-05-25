/**
 * 从原dialog迁过来，做了模块化封装
 * 功能比较成熟了，代码不做大的改动
 * 图片引入路径改成本地，工程化管理
 */

'use strict';

var d = {};

var docElem = document.documentElement,
	timeoutId = 0,
	dvWall = null,
	dvWrap = null,
	dialog = null;

/**
 * util
 */
var util = {
	/**
	 * 判断一个对象是否为数组
	 */
	isArray: function (obj) {
		return (typeof Array.isArray) ? Array.isArray(obj) : (Object.prototype.toString.call(obj) === '[object Array]');
	},

	/**
	 * 往body中插入div
	 */
	insertDom: function (newNode) {
		document.body.appendChild(newNode);
	},
	/**
	 * 初始化配置及生成dom元素
	 */
	genDom: function (opts, div_wall, div_wrap) {
		if (!opts) return;

		if (Object.prototype.toString.call(opts, null) === '[object Object]') { // 传入的object
			opts.type = opts.type || "loading";

			div_wall.style.cssText = opts.wallCss;
			div_wrap.style.cssText = opts.wrapCss;

			//生成弹窗内容
			var html = "<div class='" + opts.type + "'>";
			html += this.genIcon(opts.icon);
			html += this.genTitle(opts.title);
			html += this.genTip(opts);
			html += this.genButtons(opts.btns, opts.ext) + "</div>";
			html += this.genClose(opts.close);

			div_wrap.innerHTML = html;

		} else if (Object.prototype.toString.call(opts, null) === '[object String]') { // 配置为html
			div_wrap.innerHTML = opts;
		} else if (Object.prototype.toString.call(opts, null) === '[object HTMLDivElement]') { // 传入的dom
			opts.style.display = "inline-block";
			div_wrap.appendChild(opts);
		}

	},
	/**
	 * 生成icon相关的html
	 */
	genIcon: function (icon) {
		//默认无icon,true为默认icon
		if (!icon) return "";
		return '<p class="d-icon ' + icon + '"></p>';
	},

	/**
	 * Title的样式和HTML
	 */
	genTitle: function (title) {
		title = title || {};
		if(title.txt){
			title.color = title.color || '';
			title.size = title.size || '';
			title.cssText = title.cssText || '';

			var cssText = 'color:' + title.color + ';font-size: ' + title.size + ';' + title.cssText;

			return '<p class="d-title" style="' + cssText + '">' + title.txt + '</p>';
		}else{
			return "";
		}
	
	},

	/**
	 * 生成提示信息
	 */
	genTip: function (opts) {
		var tip = opts.tip || {},
			title = opts.title || {};

		if(tip.txt){
			if (title.txt) {
				tip.color = tip.color || "#666";
				tip.size = tip.size || '1.4rem';
			} else {
				tip.color = tip.color || "#333";
				tip.size = tip.size || '1.6rem';
			}

			var cssText = 'color:' + tip.color + ';font-size:' + tip.size + ';';
			return '<div class="d-tip" style="' + cssText + '">' + tip.txt + '</div>';
		}else{
			return "";
		}
	},
	/**
	 * 右上角关闭按钮
	 */
	genClose: function (close) {
		return close ? '<a class="d-close" href="javascript:void(0);" style="' + (close.cssText || "") + '"></a>' : '';
	},
	/**
	 * 尾部红包
	 */
	genButtons: function (btns, ext) {
		var res = "";
		if (btns && this.isArray(btns)) {
			res += '<div class="d-btns clearfix">';

			for (var i = 0, btn = null, l = btns.length; i < l; i++) {
				btn = btns[i];
				res += '<a class="' + btn.kls + '" id="' + btn.id + '">' + btn.val + '</a>';
			}

			res += '</div>';
		}
		//按钮下面附加内容
		if (ext && typeof ext === 'string') {
			res += '<p class="d-ext">' + ext + '</p>';
		}
		return res;
	},

	/**
	 * 为按钮注册事件
	 */
	addEvents: function (opts) {
		if (opts.close) {
			var close = dvWrap.getElementsByClassName("d-close")[0];
			close.addEventListener("touchstart", function () {
				dialog.hide();
			}, false);
		}

		if (!this.isArray(opts.btns) || !opts.btns.length) return;

		for (var i = 0, btn = null, l = opts.btns.length; i < l; i++) {
			btn = opts.btns[i];
			if (btn) {
				var ev = btn.event || "click",
					ele = document.getElementById(btn.id);
				if (ele) {
					ele.removeEventListener(ev, btn.handler, false);
					ele.addEventListener(ev, btn.handler, false);
				}
			}
		}
	}
};

/**
 * Dialog对象应该使用强制使用new模式
 */
var Dialog = function (opts) {
	if (!(this instanceof Dialog)) {
		dialog = new Dialog(opts);
		return dialog; // 当不使用new的时候，会走到前一句，然后再走到dialog.fn.init,然后再执行return
	} else {
		new Dialog.fn.init(opts);
	}
};

/**
 * Dialog prototype
 * @type {Function}
 */
Dialog.fn = Dialog.prototype = {
	constructor: Dialog,
	init: function (opts) {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = 0;
		}
		if (!opts) return;

		var div_wall = document.createElement('div');
		var div_wrap = document.createElement("div");
		div_wall.id = "d-wall";
		div_wrap.id = "d-wrap";

		//初始化配置 生成内容HTML
		util.genDom(opts, div_wall, div_wrap);

		//删除已存在的弹窗
		dvWall && document.body.removeChild(dvWall);
		dvWrap && document.body.removeChild(dvWrap);

		//插入dom
		util.insertDom(div_wall);
		util.insertDom(div_wrap);

		dvWall = div_wall;
		dvWrap = div_wrap;

		if (Object.prototype.toString.call(opts, null) === '[object Object]') {
			window.setTimeout(function () {
				util.addEvents(opts);
			}, 400);
		}
	},
	show: function () {
		var that = this;

		if (dvWall && dvWrap) {
			that.reset();
			dvWall.style.display = "block";
			dvWrap.style.display = "inline-block";

			window.addEventListener("resize", reset, false);
			window.addEventListener("scroll", reset, false);
			window.addEventListener('orientationchange',reset,false);
		}

		function reset(event) {
			that.reset.call(that);
		}

	},
	hide: function () {
		if (dvWall && dvWrap) {
			dvWall.style.display = "none";
			dvWrap.style.display = "none";
		}
	},
	reset: function () {
		if (dvWall && dvWrap) {
			var currWidth = document.documentElement.clientWidth;
			dvWrap.style.top = (docElem.clientHeight - dvWrap.clientHeight - 20) / 2 + "px";
			dvWrap.style.left = (docElem.clientWidth - dvWrap.clientWidth) / 2 + "px";
			var scrollH = document.body.scrollHeight || document.documentElement.scrollHeight; //考虑到页面滚动和窗体重置
			dvWall.style.width = currWidth + "px";
			dvWall.style.height = scrollH + "px";
		}
	}
};

/**
 * alert弹出框
 */
d.alert = function (cfg) {
	var opts = {};
	if (typeof arguments[0] === "string" && arguments[0]) {
		opts.title = arguments[1] || "";
		opts.tip = arguments[0];
		opts.btn = {
			val: arguments[2] || "我知道了"
		};
	} else if (cfg && typeof cfg === 'object') {
		opts = cfg;
	}

	dialog = Dialog({
		type: "alert",
		icon: "icon-alert",
		wallCss: "",
		wrapCss: "background: #fff;width: 280px;text-align: center;",
		title: {
			txt: opts.title
		},
		tip: {
			txt: opts.tip
		},
		btns: [{
			id: "btn-close",
			kls: 'btn-orange',
			event: "click",
			val: (opts.btn && opts.btn.val) || "我知道了",
			handler: function (ev) {
				dialog.hide();
				if(opts.btn){
					if (typeof opts.btn.handler === 'function') {
						opts.btn.handler(ev);
				    }
				}
			}
		}]
	});
	dialog.show();
	return dialog;
};

/**
 * confirm dialog
 */
d.confirm = function (cfg) {
	var opts = {};

	if (typeof arguments[0] === 'string' && arguments[0]) {
		opts.text = arguments[0] || "";
		opts.confirm = {};
		opts.confirm.handler = arguments[1];

	} else if (cfg && typeof cfg === 'object') {
		opts = cfg;
	}

	var cancel = opts.cancel || {};
	var confirm = opts.confirm || {};

	dialog = Dialog({
		type: "confirm",
		title: {
			txt: opts.tip ? opts.text : ""
		},
		tip: {
			txt: opts.tip ? opts.tip : opts.text
		},
		icon: "icon-confirm",
		wallCss: "",
		wrapCss: "background: #fff;width: 280px;text-align: center;",
		btns: [{
			id: cancel.id || "btn-cancel",
			val: cancel.val || "取消",
			kls: cancel.kls || "btn-white",
			event: cancel.event || "click",
			handler: function (e) {
				dialog.hide();
				if (typeof cancel.handler === 'function') {
					cancel.handler(e);
				}
			}
		}, {
			id: confirm.id || "btn-ok",
			val: confirm.val || "确定",
			kls: confirm.kls || "btn-orange",
			event: confirm.event || "click",
			handler: function (e) {
				dialog.hide();
				if (typeof confirm.handler === 'function') {
					confirm.handler(e);
				}
			}
		}],
		ext: opts.ext
	});
	dialog.show();
	return dialog;
};

/**
 * Loading Dialog
 */
d.loading = function (cfg) {
	var opts = {};
	if (typeof arguments[0] !== "object") {
		opts.text = arguments[0];
		opts.time = arguments[1] || 0
	} else {
		opts = cfg;
	}
	dialog = Dialog({
		type: "loading",
		wallCss: "",
		wrapCss: "background:#0c0d0d;opacity:0.7;width:140px;height:140px;",
		icon: "icon-loading",
		tip: {
			txt: opts.text || "正在加载",
			color: "#fff",
			size: "14px"
		}
	});

	dialog.show();

	if (!opts.time) {
		opts.time = 5000;
	}
	timeoutId = window.setTimeout(function () {
		dialog.hide();
		console.log(typeof opts.hideCB === 'function')
		if (typeof opts.hideCB === 'function') {
			opts.hideCB();
		}
	}, opts.time);
	return dialog;
};

/**
 * 扁平化的loading
 */
d.flatLoading = function (cfg) {
	var opts = {};
	if (typeof arguments[0] !== "object") {
		opts.text = arguments[0];
		opts.time = arguments[1] || 0
	} else {
		opts = cfg;
	}
	dialog = Dialog({
		type: "floading",
		wallCss: "background:#fff;opacity:1;",
		wrapCss: "background:#fff;width:140px;height:140px;",
		icon: "icon-flat",
		tip: {
			txt: opts.text || "",
			color: "#666",
			size: "14px"
		}
	});

	dialog.show();

	if (!opts.time) {
		opts.time = 5000;
	}
	timeoutId = window.setTimeout(function () {
		dialog.hide();
		if (typeof opts.hideCB === 'function') {
			opts.hideCB();
		}
	}, opts.time);
	return dialog;
};

/**
 * 滴滴打车logo的loading
 */
d.logoLoading = function (time, hideCB) {
	dialog = Dialog('<div class="loading-logo"></div>');
	dialog.show();
	if (!time) {
		time = 5000;
	}
	timeoutId = window.setTimeout(function () {
		dialog.hide();
		if (typeof hideCB === 'function') {
			hideCB();
		}
	}, time);
	return dialog;
};

/**
 //提示
 */
d.tip = function (cfg) {
	var _cfg = {};
	if (typeof arguments[0] !== "object") {
		_cfg.text = arguments[0];
		_cfg.time = arguments[1] || 0
	} else {
		_cfg = cfg;
	}
	_cfg.time = parseInt(_cfg.time) || 600;

	dialog = Dialog({
		type: "tip",
		icon: _cfg.icon || "icon-tip",
		wallCss: "background:#fff;",
		wrapCss: _cfg.wrapCss || "background:#0c0d0d;width:140px;height:140px;opacity:0.7;",
		tip: _cfg.tip || {
			txt: _cfg.text || "温馨提醒",
			color: "#fff",
			size: "14px"
		}
	});

	dialog.show();

	timeoutId = window.setTimeout(function () {
		dialog.hide();
	}, _cfg.time);
};


d.Fn = Dialog;

module.exports = d;