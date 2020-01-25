# Firejail profile for ryo-wallet-atom
# Description: Ryo Atom Wallet
# This file is overwritten after every install/update
# Persistent local customizations
include ryo-wallet-atom.local
# Persistent global definitions
include globals.local

# If the wallet is in $HOME, uncomment this line
#ignore noexec ${HOME}

# Needed for Electron
ignore noexec /tmp

noblacklist ${HOME}/.ryo

include disable-common.inc
include disable-devel.inc
include disable-exec.inc
include disable-interpreters.inc
include disable-passwdmgr.inc
include disable-programs.inc
include disable-xdg.inc

mkdir ${HOME}/.ryo
mkdir ${HOME}/.shared-ringdb
whitelist ${HOME}/.ryo
whitelist ${HOME}/.shared-ringdb
include whitelist-common.inc
include whitelist-var-common.inc

caps.drop all
ipc-namespace
netfilter
no3d
nodbus
nodvd
nogroups
nonewprivs
noroot
nosound
notv
nou2f
novideo
protocol unix,inet,inet6,netlink
seccomp
shell none

disable-mnt
private-bin ryo-wallet-atom
private-cache
private-dev
private-etc alternatives,fonts,dconf,ca-certificates,ssl,pki,crypto-policies,machine-id,resolv.conf
private-tmp
