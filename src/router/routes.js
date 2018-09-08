export default [
    {
        path: "/",
        component: () =>
            import ("layouts/init/loading"),
        children: [
            {
                path: "",
                component: () =>
                    import ("pages/init/index")
            },
            {
                path: "/quit",
                component: () =>
                    import ("pages/init/quit")
            },
        ]
    },
    {
        path: "/welcome",
        component: () =>
            import ("layouts/init/welcome"),
        children: [{
            path: "",
            component: () =>
                import ("pages/init/welcome")
        }]
    },
    {
        path: "/wallet-select",
        component: () =>
            import ("layouts/wallet-select/main"),
        children: [
            {
                path: "",
                name: "wallet-select",
                component: () =>
                    import ("pages/wallet-select/index")
            },
            {
                path: "create",
                name: "wallet-create",
                component: () =>
                    import ("pages/wallet-select/create")
            },
            {
                path: "restore",
                name: "wallet-restore",
                component: () =>
                    import ("pages/wallet-select/restore")
            },
            {
                path: "import",
                name: "wallet-import",
                component: () =>
                    import ("pages/wallet-select/import")
            },
            {
                path: "import-legacy",
                name: "wallet-import-legacy",
                component: () =>
                    import ("pages/wallet-select/import-legacy")
            },
            {
                path: "created",
                name: "wallet-created",
                component: () =>
                    import ("pages/wallet-select/created")
            }
        ]
    },
    {
        path: "/wallet",
        component: () =>
            import ("layouts/wallet/main"),
        children: [
            {
                path: "",
                component: () =>
                    import ("pages/wallet/wallet")
            },
            {
                path: "receive",
                component: () =>
                    import ("pages/wallet/receive")
            },
            {
                path: "send",
                component: () =>
                    import ("pages/wallet/send")
            },
            {
                path: "addressbook",
                component: () =>
                    import ("pages/wallet/addressbook")
            },
            {
                path: "txhistory",
                component: () =>
                    import ("pages/wallet/txhistory")
            },
        ]
    },

    { // Always leave this as last one
        path: "*",
        component: () =>
            import ("pages/404")
    }
]
