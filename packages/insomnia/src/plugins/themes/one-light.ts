const sidebarBackground = {
    default: '#eaeaeb',
    success: '#50a14f',
    notice: '#c18401',
    warning: '#c18401',
    danger: '#e45649',
    surprise: '#a626a4',
    info: '#0184bc'
};

export default {
    name: 'one-light',
    displayName: 'One Light',
    theme: {
        background: {
            default: '#fafafa',
            success: '#50a14f',
            notice: '#c18401',
            warning: '#c18401',
            danger: '#e45649',
            surprise: '#a626a4',
            info: '#0184bc'
        },
        foreground: {
            default: '#777'
        },
        highlight: {
            default: 'rgba(114, 121, 133, 1)',
            xxs: 'rgba(114, 121, 133, 0.05)',
            xs: 'rgba(114, 121, 133, 0.1)',
            sm: 'rgba(114, 121, 133, 0.2)',
            md: 'rgba(114, 121, 133, 0.3)',
            lg: 'rgba(114, 121, 133, 0.5)',
            xl: 'rgba(114, 121, 133, 0.8)'
        },
        styles: {
            appHeader: {
                background: {
                    default: '#eaeaeb'
                }
            },
            sidebar: {
                background: sidebarBackground,
                foreground: {
                    default: '#444'
                },
                highlight: {}
            },
            paneHeader: {
                background: sidebarBackground
            },
            transparentOverlay: {
                background: {
                    default: 'rgba(30, 33, 40, 0.8)'
                }
            }
        }
    }
};
