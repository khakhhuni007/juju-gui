/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
 * Drop target view extension
 *
 * @module views
 */

YUI.add('drop-target-view-extension', function(Y) {

  var views = Y.namespace('juju.views');

  /**
    Adds the drop target functionality to a view

    @method DropTargetViewExtension
  */
  function DropTargetViewExtension() {}

  DropTargetViewExtension.prototype = {
    /**
      Attaches the dragenter, dragover, drop events on the tokens container
      so that it can have a unit token dropped on it.

      @method _attachDragEvents
    */
    _attachDragEvents: function() {
      var container = this.get('container'),
          token = '.token';
      container.delegate('drop', this._unitDropHandler, token, this);
      container.delegate('dragenter', this._ignore, token, this);
      container.delegate('dragover', this._ignore, token, this);
    },

    /**
      Event handler for the unit dropping on the container token. Fires the
      unit-token-drop event with the unit id and machine information.

      @method _unitDropHandler
      @param {Object} e The drop event object.
    */
    _unitDropHandler: function(e) {
      var dragData = JSON.parse(e._event.dataTransfer.getData('Text'));
      this.fire('unit-token-drop', {
        unit: dragData.id,
        machine: this.get('machine')
      });
    },

    /**
      * Ignore a drag event.
      * @method _ignore
      */
    _ignore: function(e) {
      // This used to be an e.halt() which also stops event propogation but
      // that prevented listening to any drag events above the canvas.
      e.preventDefault();
    }
  };

  views.DropTargetViewExtension = DropTargetViewExtension;

});
