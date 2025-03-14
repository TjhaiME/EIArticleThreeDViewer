// import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";
// import { loadData, updateTextVisibility, handleClick, handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown, handleKeyUp } from "./helper.js";

// // Scene, Camera, Renderer Setup
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 0, 50);
// const renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const raycaster = new THREE.Raycaster();
// let nodes = [], textSprites = [], instancedMesh;
// let textLines = []; // Stores the lines connecting text to nodes
// let keys = {};
// const state = { isMouseDown: false, prevMouseX: 0, prevMouseY: 0 };
import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";
import { loadData, updateTextVisibility, handleClick, handleMouseMove, handleMouseDown, handleMouseUp, handleKeyDown, handleKeyUp } from "./helper.js";

// Function to get `maxNodes` from URL or default to 300
function getMaxNodesFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get("maxNodes")) || 300; // Default to 300 if not set
}
function getSettingsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        maxNodes: parseInt(urlParams.get("maxNodes")) || 300, // Default 300 nodes
        minFontSize: parseInt(urlParams.get("minFontSize")) || 60, // Default min font size 12px
        maxFontSize: parseInt(urlParams.get("maxFontSize")) || 500, // Default max font size 50px
    };
}
const settings = getSettingsFromURL();
console.log(`Max Nodes: ${settings.maxNodes}`);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
let nodes = [], textSprites = [], instancedMesh;
let textLines = []; // Stores lines for text connections
let keys = {};
const state = { isMouseDown: false, prevMouseX: 0, prevMouseY: 0 };



// Get `maxNodes` from URL
const maxNodes = getMaxNodesFromURL();
console.log(`Max Nodes: ${maxNodes}`); // Debugging output




// Text Sprite Creation with dynamic scaling
function createTextSprite(message, fontSize = 40, maxLineWidth = 200) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const padding = 10;

    // Set initial font
    context.font = `${fontSize}px Arial`;

    // Function to wrap text
    function wrapText(ctx, text, maxWidth) {
        const words = text.split(" ");
        let lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            let testLine = currentLine + " " + words[i];
            let testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxWidth && i > 0) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // Wrap the text
    const lines = wrapText(context, message, maxLineWidth);
    const textHeight = fontSize * lines.length;

    // Resize canvas to fit wrapped text
    canvas.width = maxLineWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Redraw with correct dimensions
    context.font = `${fontSize}px Arial`;
    context.fillStyle = "white";
    context.textBaseline = "top";

    lines.forEach((line, i) => {
        context.fillText(line, padding, padding + i * fontSize);
    });

    // Apply texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    // Scale sprite correctly
    sprite.scale.set(canvas.width / 200, canvas.height / 200, 1);
    return sprite;
}


// function createTextSprite(message) {
//     const canvas = document.createElement("canvas");
//     const context = canvas.getContext("2d");
//     const baseFontSize = 40; // Base font size
//     const padding = 10;

//     context.font = `${baseFontSize}px Arial`;
//     const textWidth = context.measureText(message).width;
//     canvas.width = textWidth + padding * 2;
//     canvas.height = baseFontSize + padding * 2;

//     context.font = `${baseFontSize}px Arial`;
//     context.fillStyle = "white";
//     context.fillText(message, padding, baseFontSize + padding / 2);

//     const texture = new THREE.CanvasTexture(canvas);
//     texture.needsUpdate = true;
//     const material = new THREE.SpriteMaterial({ map: texture });
//     const sprite = new THREE.Sprite(material);
    
//     return sprite;
// }

// Create Line from Node to Text
function createTextLine(nodePosition, textSprite) {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const geometry = new THREE.BufferGeometry().setFromPoints([nodePosition, textSprite.position]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
}

// Load Data and Initialize Graph
// loadData(scene, nodes, textSprites, (mesh) => {
//     instancedMesh = mesh;
    
//     // Create lines for text
//     nodes.forEach((node, i) => {
//         const line = createTextLine(node.position, textSprites[i]);
//         textLines.push(line);
//     });
// }, createTextSprite);

// Load Data and Initialize Graph with `maxNodes`
loadData(scene, nodes, textSprites, (mesh) => {
    instancedMesh = mesh;
    
    // Create lines for text **only for visible nodes**
    nodes.forEach((node, i) => {
        if (textSprites[i]) { // Ensure text exists before creating a line
            const line = createTextLine(node.position, textSprites[i]);
            textLines.push(line);
        }
    });

}, createTextSprite, maxNodes);

// // UI to change settings
// const settingsDiv = document.createElement("div");
// settingsDiv.style.position = "fixed";
// settingsDiv.style.bottom = "10px";
// settingsDiv.style.left = "10px";
// settingsDiv.style.background = "rgba(0,0,0,0.8)";
// settingsDiv.style.padding = "10px";
// settingsDiv.style.color = "white";
// settingsDiv.innerHTML = `
//     <label for="nodeCount">Max Nodes:</label>
//     <input type="number" id="nodeCount" value="${settings.maxNodes}" min="50" max="2000" step="50"><br>
    
//     <label for="minFont">Min Font Size:</label>
//     <input type="number" id="minFont" value="${settings.minFontSize}" min="5" max="50" step="1"><br>
    
//     <label for="maxFont">Max Font Size:</label>
//     <input type="number" id="maxFont" value="${settings.maxFontSize}" min="10" max="100" step="1"><br>
    
//     <button id="applySettings">Apply</button>

//     <br><br>
//     <a href="https://github.com/TjhaiME/Test" target="_blank" id="codeLink"
//        style="display: inline-block; padding: 5px 10px; background: #007BFF; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
//        Link to Code
//     </a>
// `;
// document.body.appendChild(settingsDiv);

// UI to change settings
const settingsDiv = document.createElement("div");
settingsDiv.style.position = "fixed";
settingsDiv.style.bottom = "10px";
settingsDiv.style.left = "10px";
settingsDiv.style.background = "rgba(0,0,0,0.8)";
settingsDiv.style.padding = "10px";
settingsDiv.style.color = "white";
settingsDiv.innerHTML = `
    <label for="nodeCount">Max Nodes:</label>
    <input type="number" id="nodeCount" value="${settings.maxNodes}" min="50" max="2000" step="50"><br>
    
    <label for="minFont">Min Font Size:</label>
    <input type="number" id="minFont" value="${settings.minFontSize}" min="5" max="50" step="1"><br>
    
    <label for="maxFont">Max Font Size:</label>
    <input type="number" id="maxFont" value="${settings.maxFontSize}" min="10" max="100" step="1"><br>
    
    <button id="applySettings">Apply</button>

    <br><br>
    <a href="https://github.com/TjhaiME/Test" target="_blank" id="codeLink"
       style="display: inline-block; padding: 5px 10px; background: #007BFF; color: white; text-decoration: none; border-radius: 5px; text-align: center;">
       Link to Code
    </a>

    <br><br>
    <p style="font-size: 12px; color: lightgray; text-align: center; margin-top: 5px;">
        WASD to move | Click and drag left mouse to rotate
    </p>
`;
document.body.appendChild(settingsDiv);


// Update URL & Reload on Change
// document.getElementById("applyNodes").addEventListener("click", () => {
//     const newMax = document.getElementById("nodeCount").value;
//     const url = new URL(window.location);
//     url.searchParams.set("maxNodes", newMax);
//     window.location = url.toString(); // Reload page with new maxNodes
// });
document.getElementById("applySettings").addEventListener("click", () => {
    settings.maxNodes = parseInt(document.getElementById("nodeCount").value);
    settings.minFontSize = parseInt(document.getElementById("minFont").value);
    settings.maxFontSize = parseInt(document.getElementById("maxFont").value);

    const url = new URL(window.location);
    url.searchParams.set("maxNodes", settings.maxNodes);
    url.searchParams.set("minFontSize", settings.minFontSize);
    url.searchParams.set("maxFontSize", settings.maxFontSize);

    //window.history.replaceState(null, "", url.toString()); // Update URL without reloading
    // Force a page reload to apply changes
    window.location.href = url.toString();
    console.log("Settings updated:", settings); // Debugging
});


// function updateTextSizeAndPosition() {
//     textSprites.forEach((sprite, i) => {
//         const node = nodes[i];
//         if (!node || !node.textMessage) return;

//         const distance = camera.position.distanceTo(node.position);
//         const adjustedFontSize = Math.max(10, 500 / distance); // Scales properly with distance

//         // Avoid unnecessary redraws
//         if (node.currentFontSize !== adjustedFontSize) {
//             node.currentFontSize = adjustedFontSize;

//             // Create a new texture with the updated font size
//             const newCanvas = document.createElement("canvas");
//             const ctx = newCanvas.getContext("2d");
//             const padding = 10;

//             ctx.font = `${adjustedFontSize}px Arial`;
//             const textWidth = ctx.measureText(node.textMessage).width;
//             newCanvas.width = textWidth + padding * 2;
//             newCanvas.height = adjustedFontSize + padding * 2;

//             ctx.font = `${adjustedFontSize}px Arial`;
//             ctx.fillStyle = "white";
//             ctx.textBaseline = "middle";
//             ctx.fillText(node.textMessage, padding, adjustedFontSize / 1.5);

//             // Update texture
//             const newTexture = new THREE.CanvasTexture(newCanvas);
//             newTexture.needsUpdate = true;

//             sprite.material.map.dispose(); // Clean up old texture
//             sprite.material.map = newTexture;
//             sprite.material.needsUpdate = true;

//             // Scale sprite properly (so text looks consistent)
//             sprite.scale.set(newCanvas.width / 200, newCanvas.height / 200, 1);
//         }

//         // Keep text positioned above node
//         sprite.position.copy(node.position.clone().add(new THREE.Vector3(0, 2, 0)));

//         // Ensure text always faces the camera
//         sprite.lookAt(camera.position);
//     });
// }

// function updateTextSizeAndPosition() {
//     textSprites.forEach((sprite, i) => {
//         const node = nodes[i];
//         if (!node || !node.textMessage) return;

//         const distance = camera.position.distanceTo(node.position);
//         const minFontSize = 22;//12  // Ensure text never gets too small
//         const maxFontSize = 100;//50  // Prevent excessive scaling
//         const adjustedFontSize = Math.max(minFontSize, Math.min(maxFontSize, 500 / distance)); // Clamp size

//         // Avoid unnecessary redraws
//         if (node.currentFontSize !== adjustedFontSize) {
//             node.currentFontSize = adjustedFontSize;

//             // Create a new texture with the updated font size
//             const newCanvas = document.createElement("canvas");
//             const ctx = newCanvas.getContext("2d");
//             const padding = 10;

//             ctx.font = `${adjustedFontSize}px Arial`;
//             const textWidth = ctx.measureText(node.textMessage).width;
//             newCanvas.width = textWidth + padding * 2;
//             newCanvas.height = adjustedFontSize + padding * 2;

//             ctx.font = `${adjustedFontSize}px Arial`;
//             ctx.fillStyle = "white";
//             ctx.textBaseline = "middle";
//             ctx.fillText(node.textMessage, padding, adjustedFontSize / 1.5);

//             // Update texture
//             const newTexture = new THREE.CanvasTexture(newCanvas);
//             newTexture.needsUpdate = true;

//             sprite.material.map.dispose(); // Clean up old texture
//             sprite.material.map = newTexture;
//             sprite.material.needsUpdate = true;

//             // Scale sprite correctly
//             sprite.scale.set(newCanvas.width / 200, newCanvas.height / 200, 1);
//         }

//         // Keep text positioned above node
//         sprite.position.copy(node.position.clone().add(new THREE.Vector3(0, 2, 0)));

//         // Ensure text always faces the camera
//         sprite.lookAt(camera.position);
//     });
// }
function updateTextSizeAndPosition() {
    textSprites.forEach((sprite, i) => {
        const node = nodes[i];
        if (!node || !node.textMessage) return;

        const distance = camera.position.distanceTo(node.position);
        const adjustedFontSize = Math.max(settings.minFontSize, Math.min(settings.maxFontSize, 500 / distance)); // Clamp size

        // Avoid unnecessary redraws
        if (node.currentFontSize !== adjustedFontSize) {
            node.currentFontSize = adjustedFontSize;

            // Create a new texture with the updated font size
            const newCanvas = document.createElement("canvas");
            const ctx = newCanvas.getContext("2d");
            const padding = 10;

            ctx.font = `${adjustedFontSize}px Arial`;
            const textWidth = ctx.measureText(node.textMessage).width;
            newCanvas.width = textWidth + padding * 2;
            newCanvas.height = adjustedFontSize + padding * 2;

            ctx.font = `${adjustedFontSize}px Arial`;
            ctx.fillStyle = "white";
            ctx.textBaseline = "middle";
            ctx.fillText(node.textMessage, padding, adjustedFontSize / 1.5);

            // Update texture
            const newTexture = new THREE.CanvasTexture(newCanvas);
            newTexture.needsUpdate = true;

            sprite.material.map.dispose(); // Clean up old texture
            sprite.material.map = newTexture;
            sprite.material.needsUpdate = true;

            // Scale sprite correctly
            sprite.scale.set(newCanvas.width / 200, newCanvas.height / 200, 1);
        }

        // Keep text positioned above node
        sprite.position.copy(node.position.clone().add(new THREE.Vector3(0, 2, 0)));

        // Ensure text always faces the camera
        sprite.lookAt(camera.position);
    });
}


// Event Listeners
window.addEventListener("click", (event) => handleClick(event, raycaster, camera, nodes, instancedMesh));
window.addEventListener("mousedown", (event) => handleMouseDown(event, state));
window.addEventListener("mouseup", () => handleMouseUp(state));
window.addEventListener("mousemove", (event) => handleMouseMove(event, camera, state));
window.addEventListener("keydown", (event) => handleKeyDown(event, keys));
window.addEventListener("keyup", (event) => handleKeyUp(event, keys));

// Animation Loop
// function animate() {
//     requestAnimationFrame(animate);

//     // Handle movement
//     const direction = new THREE.Vector3();
//     camera.getWorldDirection(direction);
//     const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
//     const up = new THREE.Vector3().crossVectors(right, direction).normalize();

//     if (keys["KeyW"]) camera.position.addScaledVector(direction, 0.5);
//     if (keys["KeyS"]) camera.position.addScaledVector(direction, -0.5);
//     if (keys["KeyA"]) camera.position.addScaledVector(right, -0.5);
//     if (keys["KeyD"]) camera.position.addScaledVector(right, 0.5);
//     if (keys["KeyQ"]) camera.position.addScaledVector(up, -0.5);
//     if (keys["KeyE"]) camera.position.addScaledVector(up, 0.5);

//     // Update text size & position
//     updateTextSizeAndPosition();

//     // Manage visibility
//     updateTextVisibility(camera, nodes);

//     renderer.render(scene, camera);
// }
function animate() {
    requestAnimationFrame(animate);

    // Handle movement
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, direction).normalize();

    if (keys["KeyW"]) camera.position.addScaledVector(direction, 0.5);
    if (keys["KeyS"]) camera.position.addScaledVector(direction, -0.5);
    if (keys["KeyA"]) camera.position.addScaledVector(right, -0.5);
    if (keys["KeyD"]) camera.position.addScaledVector(right, 0.5);
    if (keys["KeyQ"]) camera.position.addScaledVector(up, -0.5);
    if (keys["KeyE"]) camera.position.addScaledVector(up, 0.5);

    // Update text size properly
    updateTextSizeAndPosition();

    // Manage visibility of text AND lines
    updateTextVisibility(camera, nodes, textLines);

    renderer.render(scene, camera);
}


animate();

// Window Resize Handler
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
