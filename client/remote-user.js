
AFRAME.registerComponent('remote-controls', {

  schema: {
    owner: {default: 'local'},
    color: {default: '#33a02c'}
  },

  init: function () {
    console.log(this.data);
    var el = this.el;
    var self = this;
    el.setAttribute('json-model', {src: 'assets/models/controller_vive.json'});
    var textureUrl = 'assets/images/controller-diffuse.png';

    function createTexture (texture) {
      var material = self.highLightMaterial = new THREE.MeshBasicMaterial();
      material.map = texture;
      material.needsUpdate = true;
      material.color = self.data.color;
    }
    el.sceneEl.systems.material.loadTexture(textureUrl, {src: textureUrl}, createTexture);
  },

  tick: function(time,delta){}

});
