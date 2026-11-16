function aspectRatioToFov(aspectRatio: number): number {
    return Math.round(27.1463 * aspectRatio + 31.9058);
}

function fovToAspectRatio(fov: number): number {
    return (fov - 31.9058) / 27.1463;
}

export {aspectRatioToFov, fovToAspectRatio};