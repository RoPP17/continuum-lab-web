%% CFD 2D: Calle de Vortices de Von Karman (Lattice Boltzmann D2Q9 BGK)
% Flujo laminar incompresible alrededor de un cilindro a Re = 180.
clear; clc;

Nx = 320; Ny = 100;
Re = 180; uIn = 0.08;
cx_cyl = 75; cy_cyl = 50; r_cyl = 11; D = 2 * r_cyl;
nu = uIn * D / Re;
omega = 1.0 / (3.0 * nu + 0.5);

w  = [4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36];
ex = [0, 1, 0, -1, 0, 1, -1, -1, 1];
ey = [0, 0, 1, 0, -1, 1, 1, -1, -1];
opp = [1, 4, 5, 2, 3, 8, 9, 6, 7];

[X, Y] = ndgrid(1:Nx, 1:Ny);
cyl = ((X - cx_cyl).^2 + (Y - cy_cyl).^2) <= r_cyl^2;

rho = ones(Nx, Ny);
ux = uIn * ones(Nx, Ny); ux(cyl) = 0;
uy = zeros(Nx, Ny);
f = zeros(Nx, Ny, 9);
for q = 1:9
    cu = ex(q)*ux + ey(q)*uy;
    f(:,:,q) = w(q) * rho .* (1 + 3*cu + 4.5*cu.^2 - 1.5*(ux.^2 + uy.^2));
end

nSteps = 4000;
for step = 1:nSteps
    rho = sum(f, 3);
    ux = sum(f .* reshape(ex,1,1,9), 3) ./ rho;
    uy = sum(f .* reshape(ey,1,1,9), 3) ./ rho;
    ux(1,:) = uIn; uy(1,:) = 0; rho(1,:) = 1.0;

    for q = 1:9
        cu = ex(q)*ux + ey(q)*uy;
        feq = w(q) * rho .* (1 + 3*cu + 4.5*cu.^2 - 1.5*(ux.^2 + uy.^2));
        f(:,:,q) = f(:,:,q) - omega * (f(:,:,q) - feq);
    end

    % Bounce-back en cilindro
    for q = 1:9
        tmp = f(:,:,q); tmp(cyl) = f(cyl + (opp(q)-1)*Nx*Ny);
        f(:,:,q) = tmp;
    end
    for q = 1:9
        f(:,:,q) = circshift(f(:,:,q), [ex(q), ey(q)]);
    end
    f(Nx,:,:) = f(Nx-1,:,:);
end

vort = (circshift(uy,[-1,0]) - circshift(uy,[1,0]))/2 - ...
       (circshift(ux,[0,-1]) - circshift(ux,[0,1]))/2;
imagesc(vort'); axis equal tight; colormap('gray'); colorbar;
title(sprintf('Von Karman LBM D2Q9 (Re = %d)', Re));
