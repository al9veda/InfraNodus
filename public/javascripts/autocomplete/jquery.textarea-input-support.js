/*
 * jQuery Textarea Input Support Plugin
 * https://github.com/mataki/jquery-textarea-imput-support
 *
 * Copyright 2011, Akihiro Matsumura
 * https://blog.mat-aki.net/
 *
 * Licensed under the MIT license:
 * http://creativecommons.org/licenses/MIT/
 */

/* global jQuery */

(function($) {
  $.widget("ui.textareainputsupport", $.ui.autocomplete.prototype);

  $.extend($.ui.textareainputsupport.prototype, {
    search: function(value, event){
      value = value != null ? value : getCaretWord(this.element).text;

      if ( value.length < this.options.minLength ) {
        return this.close( event );
      }

      clearTimeout( this.closing );
      if ( this._trigger("search") === false ) {
        return undefined;
      }

      return this._search( value );
    },
    _initSource: function() {
      var array,
          url;
      if ( $.isArray(this.options.source) ) {
        array = this.options.source;
        this.source = function( request, response ) {
          response( $.ui.textareainputsupport.filter(array, request.term) );
        };
      } else if ( typeof this.options.source === "string" ) {
        url = this.options.source;
        this.source = function( request, response ) {
          $.getJSON( url, request, response );
        };
      } else {
        this.source = this.options.source;
      }
    },
    _create: function() {
      var self = this,
          doc = this.element[ 0 ].ownerDocument;
      this.element
        .addClass( "ui-autocomplete-input" )
        .attr( "autocomplete", "off" )
      // TODO verify these actually work as intended
        .attr({
          role: "textbox",
          "aria-autocomplete": "list",
          "aria-haspopup": "true"
        })
        .bind( "keydown.autocomplete", self.keydownFunc(self))
        .bind( "focus.autocomplete", function() {
          if ( self.options.disabled ) {
            return;
          }

          self.selectedItem = null;
          self.previous = self.element.val();
        })
        .bind( "blur.autocomplete", function( event ) {
          if ( self.options.disabled ) {
            return;
          }

          clearTimeout( self.searching );
          // clicks on the menu (or a button to trigger a search) will cause a blur event
          self.closing = setTimeout(function() {
            self.close( event );
            self._change( event );
          }, 150 );
        });
      this._initSource();
      this.response = function() {
        return self._response.apply( self, arguments );
      };
      this.menu = $( "<ul></ul>" )
        .addClass( "ui-autocomplete" )
        .appendTo( $( this.options.appendTo || "body", doc )[0] )
      // prevent the close-on-blur in case of a "slow" click on the menu (long mousedown)
        .mousedown(function( event ) {
          // clicking on the scrollbar causes focus to shift to the body
          // but we can't detect a mouseup or a click immediately afterward
          // so we have to track the next mousedown and close the menu if
          // the user clicks somewhere outside of the autocomplete
          var menuElement = self.menu.element[ 0 ];
          if ( event.target === menuElement ) {
            setTimeout(function() {
              $( document ).one( 'mousedown', function( event ) {
                if ( event.target !== self.element[ 0 ] &&
                     event.target !== menuElement &&
                     !$.ui.contains( menuElement, event.target ) ) {
                       self.close();
                     }
              });
            }, 1 );
          }

          // use another timeout to make sure the blur-event-handler on the input was already triggered
          setTimeout(function() {
            clearTimeout( self.closing );
          }, 13);
        })
        .menu(this.menuOpt(self, doc))
        .zIndex( this.element.zIndex() + 1 )
      // workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
        .css({ top: 0, left: 0 })
        .hide()
        .data( "menu" );
      if ( $.fn.bgiframe ) {
        this.menu.element.bgiframe();
      }
    },
    keydownFunc: function(self) {
      return function(event){
        if ( self.options.disabled ) {
          return;
        }

        var keyCode = $.ui.keyCode;
        switch( event.keyCode ) {
        case keyCode.PAGE_UP:
          self._move( "previousPage", event );
          break;
        case keyCode.PAGE_DOWN:
          self._move( "nextPage", event );
          break;
        case keyCode.UP:
          self._move( "previous", event );
          // prevent moving cursor to beginning of text field in some browsers
          event.preventDefault();
          break;
        case keyCode.DOWN:
          self._move( "next", event );
          // prevent moving cursor to end of text field in some browsers
          event.preventDefault();
          break;
        case keyCode.ENTER:
        case keyCode.NUMPAD_ENTER:
          // when menu is open or has focus
          if ( self.menu.element.is( ":visible" ) ) {
            event.preventDefault();
          }
          //passthrough - ENTER and TAB both select the current element
        case keyCode.TAB:
          if ( !self.menu.active ) {
            self._move( "next", event );
          }
          self.menu.select( event );
          break;
        case keyCode.ESCAPE:
          self.element.val( self.term );
          self.close( event );
          break;
        default:
          // keypress is triggered before the input value is changed
          clearTimeout( self.searching );
          self.searching = setTimeout(function() {
            // only search if the value has changed
            if ( self.term != self.element.val() ) {
              self.selectedItem = null;
              self.search( null, event );
            }
          }, self.options.delay );
          break;
        }
      };
    },
    menuOpt: function(self, doc){
      return {
        focus: function( event, ui ) {
          var item = ui.item.data( "item.autocomplete" );
          if ( false !== self._trigger( "focus", null, { item: item } ) ) {
            // use value to match what will end up in the input, if it was a key event
            if ( /^key/.test(event.originalEvent.type) ) {
              self.element.val( item.value );
            }
          }
        },
        selected: function( event, ui ) {
          var item = ui.item.data( "item.autocomplete" ),
              previous = self.previous;

          // only trigger when focus was lost (click on menu)
          if ( self.element[0] !== doc.activeElement ) {
            self.element.focus();
            self.previous = previous;
          }

          if ( false !== self._trigger( "select", event, { item: item } ) ) {
            self.element.val( item.value );
          }

          self.close( event );
          self.selectedItem = item;
        },
        blur: function( event, ui ) {
          // don't set the value of the text field if it's already correct
          // this prevents moving the cursor unnecessarily
          if ( self.menu.element.is(":visible") &&
               ( self.element.val() !== self.term ) ) {
                 self.element.val( self.term );
               }
        }
      };
    }
  });

  $.extend( $.ui.textareainputsupport, {
    escapeRegex: function( value ) {
      return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    },
    filter: function(array, term){
      return selectHeadMatch(array, term);
    }
  });

  $.extend( $.ui.textareainputsupport.prototype.options, {
    select: function( event, ui ) {
      var curPos = getCaretWord(this);
      $(this).setSelection(curPos.start, curPos.end);
      $(this).replaceSelectedText(ui.item.value + " ");
      return false;
    },
    focus: function(event, ui){
      var oldPos = $(this).getSelection();
      var oldselect = getCaretWord(this);

      $(this).setSelection(oldselect.start, oldselect.end);
      $(this).replaceSelectedText(ui.item.value);
      $(this).setSelection(oldPos.start, oldselect.start + ui.item.value.length);
      return false;
    }
  });

  function hasPrefix(word){
    var prefixs = ["@", "+"];
    isInclude(prefixs, word[0]);
  }

  function isInclude(array, obj){
    var res = $.grep(array, function(n,i){
      return (n == obj);
    });
    return res.length > 0;
  };

  $.getPositionWord = function(text, pos){
    var start, end;
    var delimiter = [" ", "　", "\n"];

    for(var i = pos; i >= 0; i--){
      var res = isInclude(delimiter, text[i-1]);
      if(res){
        break;
      }
      start = i-1;
      start = start > 0 ? start : 0;
    }

    for(i = pos; i <= text.length; i++){
      end = i;
      if(isInclude(delimiter, text[i])){
        break;
      }
    }

    return { start: start, end: end, text: text.slice(start, end) };
  };

  function getCaretWord(obj){
    var elem = $(obj);
    var sel = elem.getSelection();
    var text = elem.val();
    var result = $.getPositionWord(text, sel.start);

    return result;
  };

  function selectHeadMatch(array, term){
    var reg = RegExp("^" + term, "i");
    return $.grep(array, function(n,i){
      return reg.test(n);
    });
  };
})(jQuery);
