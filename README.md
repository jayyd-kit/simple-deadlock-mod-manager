# Simple Deadlock Mod Manager

[![AUR](https://img.shields.io/aur/version/simple-deadlock-mod-manager?logo=archlinux)](https://aur.archlinux.org/packages/simple-deadlock-mod-manager/)
[![AUR-GIT](https://img.shields.io/aur/version/simple-deadlock-mod-manager-git?logo=archlinux)](https://aur.archlinux.org/packages/simple-deadlock-mod-manager-git/)
[![Gamebanana](https://img.shields.io/badge/Gamebanana-0.6.4-yellow?logo=gamebanana)](https://gamebanana.com/tools/22154)

![Trans Ware](https://pride-badges.pony.workers.dev/static/v1?label=Trans%20Ware&stripeWidth=6&stripeColors=5BCEFA,F5A9B8,FFFFFF,F5A9B8,5BCEFA)

A lightweight mod manager for **Deadlock**.

**No AI has been used for this project.**

## Installation

Go to the [Releases Page](https://github.com/Gabri3445/simple-deadlock-mod-manager/releases)

### Windows:

- Download either `simple-deadlock-mod-manager_x.x.x_x64-setup.exe` or `simple-deadlock-mod-manager_x.x.x_x64_en-US.msi`
- A portable version is also available with `simple-deadlock-mod-manager.exe`

### Linux

#### Debian Based (using dpkg/apt)

- Download `simple-deadlock-mod-manager_x.x.x_amd64.deb`
- Run `sudo apt install ./simple-deadlock-mod-manager_x.x.x_amd64.deb`

#### Red Hat (using rpm, yum)

- Download `simple-deadlock-mod-manager-x.x.x-x.x86_64.rpm`
- Run `sudo yum install simple-deadlock-mod-manager-x.x.x-x.x86_64.rpm`

#### Arch (using pacman/yay/paru)

- Run `yay -S simple-deadlock-mod-manager`
- Or run `yay -S simple-deadlock-mod-manager-git` (outdated)

#### All of the above and any other distro

- Download simple-deadlock-mod-manager_x.x.x_amd64.AppImage
- Run `./simple-deadlock-mod-manager_x.x.x_amd64.AppImage`

## Features

- [x] Load `.vpk` mod files
- [x] Assign custom names to mods
- [x] Automatic **Deadlock** path detection
- [x] Automatically fixes/updates `gameinfo.gi` to keep it valid
- [x] Enable and disable mods easily
- [x] Deleting mods
- [x] Drag and drop
- [x] Load `.vpk` files directly from `.zip` or `.rar` archives
- [x] Download mods directly from **GameBanana**
- [ ] Check for mod updates


## Not Planned (For now)

- Automatic mod updates (Please see [Deadlock Mod Loader](https://github.com/Tylevo/DeadlockModManager) or [Deadlock Mod Manager](https://github.com/deadlock-mod-manager/deadlock-mod-manager) if you want your mods to update automatically)

## Usage

- Open the options menu to set the path to your deadlock installation.
- Make sure the gameinfo.gi file is valid.
- Use the **Add Mod** button in the top right or drag and drop the file anywhere in the window.
- (Optional) Double-click the names to change them
- Select the mods you wish to load and use the `>>` button to load them and the `<<` button to unload them
- Click **Apply**

**Attention: Almost everytime deadlock is updated, the gameinfo.gi file becomes invalid, make sure to validate it and make it valid if needed**

This app is still early in development and while it should not mess anything up, I would recommend backing up your mods every so often. <br>
If deadlock fails to start due to a corrupt gameinfo.gi file simply verify the integrity of the game files through steam. (Make sure to revalidate the file if you want mods to load)<br>
If the mod manager fails to start, try deleting the config file located at `$HOME/.config/sdmm/config.json` or
`C:/Users/<username>/AppData/Roaming/sdmm`



## Platform Support

- **Linux:** Tested
- **Windows:** Not tested, but should work.

## Tech stack
- ![Tauri](https://img.shields.io/badge/Tauri-000000?logo=tauri)
- ![Rust](https://img.shields.io/badge/Rust-000000?logo=rust)
- ![React](https://img.shields.io/badge/React-000000?logo=react)
- ![Vite](https://img.shields.io/badge/Vite-000000?logo=vite)
- ![Tailwind](https://img.shields.io/badge/Tailwind-000000?logo=tailwindcss)
- ![Mui](https://img.shields.io/badge/MaterialUI-000000?logo=mui)
- ![Zustand](https://img.shields.io/badge/Zustand-000000)


## Building from source
Please see https://v2.tauri.app/start/prerequisites/

You might need to set `NO_STRIP=TRUE` if you're building an AppImage.
```shell
git clone https://github.com/Gabri3445/simple-deadlock-mod-manager.git # Clone the repo
cd simple-deadlock-mod-manager
pnpm i # Install packages
cd src-tauri
cargo install tauri-typegen
cargo tauri-typegen generate # generate types
cd ..
pnpm tauri build
```
