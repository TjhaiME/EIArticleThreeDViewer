import * as THREE from "https://cdn.jsdelivr.net/npm/three@latest/build/three.module.js";

// Load data and create graph
export async function loadData(scene, nodes, textSprites, setMeshCallback, createTextSprite, maxNodes) {
    try {
        const response = await fetch("pca_data.json");
        const data = await response.json();
        
        console.log(`Loading ${maxNodes} nodes`); // Debugging output

        const mesh = createInstancedGraph(scene, nodes, textSprites, data.slice(0, maxNodes), createTextSprite);
        setMeshCallback(mesh);
    } catch (error) {
        console.error("Error loading PCA data:", error);
    }
}

// export async function loadData(scene, nodes, textSprites, setMeshCallback, createTextSprite) {
//     try {
//         const response = await fetch("reduced_pca_data.json");
//         const data = await response.json();
//         let maxNodes = 300;

//         const mesh = createInstancedGraph(scene, nodes, textSprites, data.slice(0, maxNodes), createTextSprite);
//         setMeshCallback(mesh);
//     } catch (error) {
//         console.error("Error loading PCA data:", error);
//     }
// }

// Create Instanced Graph
export function createInstancedGraph(scene, nodes, textSprites, data, createTextSprite) {
    const nodeCount = data.length;
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const instancedMesh = new THREE.InstancedMesh(geometry, material, nodeCount);
    scene.add(instancedMesh);

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(nodeCount * 3);
    const spreadScale = 100;

    data.forEach((node, i) => {
        dummy.position.set(node.PC1 * spreadScale, node.PC2 * spreadScale, node.PC3 * spreadScale);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        const color = new THREE.Color().setHSL((node.Cluster * 0.1) % 1, 1, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // Create text sprite
        const textSprite = createTextSprite(node.Article);
        textSprite.position.copy(dummy.position.clone().add(new THREE.Vector3(0, 2, 0)));
        scene.add(textSprite);
        textSprites.push(textSprite);

        //nodes.push({ position: dummy.position.clone(), url: node.URL, cluster: node.Cluster, color: color.clone(), text: textSprite });
        nodes.push({ 
            position: dummy.position.clone(), 
            url: node.URL, 
            cluster: node.Cluster, 
            color: color.clone(), 
            text: textSprite,
            textMessage: node.Article // Store the actual text content
        });
        
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    instancedMesh.geometry.setAttribute("color", new THREE.InstancedBufferAttribute(colors, 3));
    instancedMesh.geometry.attributes.color.needsUpdate = true;

    return instancedMesh;
}

// Update text visibility based on camera distance
export function updateTextVisibility(camera, nodes, textLines) {
    const maxVisibleTexts = 20; // Max texts visible at a time
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();

    // Compute the camera's frustum (viewing area)
    camera.updateMatrixWorld(); 
    camera.updateProjectionMatrix();
    cameraViewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    // Get nodes in view
    let visibleNodes = nodes
        .map((node, i) => ({
            index: i,
            distance: camera.position.distanceTo(node.position),
            isVisible: frustum.containsPoint(node.position) // Check if inside the camera's view
        }))
        .filter(n => n.isVisible) // Keep only nodes inside the frustum
        .sort((a, b) => a.distance - b.distance) // Sort by distance (nearest first)
        .slice(0, maxVisibleTexts); // Limit max visible texts

    // Apply visibility to text & lines
    nodes.forEach((node, i) => {
        const shouldBeVisible = visibleNodes.some(n => n.index === i);
        if (node.text) node.text.visible = shouldBeVisible;
        if (textLines[i]) textLines[i].visible = shouldBeVisible;
    });
}


// Handle click interactions
export function handleClick(event, raycaster, camera, nodes, instancedMesh) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(instancedMesh);

    if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId;
        if (instanceId !== undefined && nodes[instanceId]) {
            window.open(nodes[instanceId].url, "_blank");
        }
    }
}

// Handle mouse and keyboard inputs
export function handleMouseDown(event, state) {
    state.isMouseDown = true;
    state.prevMouseX = event.clientX;
    state.prevMouseY = event.clientY;
}

export function handleMouseUp(state) {
    state.isMouseDown = false;
}

export function handleMouseMove(event, camera, state) {
    if (!state.isMouseDown) return;

    const deltaX = event.clientX - state.prevMouseX;
    const deltaY = event.clientY - state.prevMouseY;
    state.prevMouseX = event.clientX;
    state.prevMouseY = event.clientY;

    camera.rotation.y -= deltaX * 0.002;
    camera.rotation.x -= deltaY * 0.002;
}

export function handleKeyDown(event, keys) {
    keys[event.code] = true;
}

export function handleKeyUp(event, keys) {
    keys[event.code] = false;
}
