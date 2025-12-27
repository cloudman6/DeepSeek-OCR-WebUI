import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from './AppHeader.vue'
import { NLayoutHeader, NButton, NTag } from 'naive-ui'

describe('AppHeader', () => {
    it('renders branding correctly', () => {
        const wrapper = mount(AppHeader, {
            global: {
                components: {
                    NLayoutHeader,
                    NButton,
                    NTag
                }
            },
            props: {
                pageCount: 0
            }
        })

        expect(wrapper.text()).toContain('Scan2Doc')
        expect(wrapper.find('.header-brand').exists()).toBe(true)
    })

    it('displays correct page count', () => {
        const wrapper = mount(AppHeader, {
            global: {
                components: {
                    NLayoutHeader,
                    NButton,
                    NTag
                }
            },
            props: {
                pageCount: 5
            }
        })

        expect(wrapper.text()).toContain('5 Pages Loaded')
    })

    it('emits add-files event when import button is clicked', async () => {
        const wrapper = mount(AppHeader, {
            global: {
                components: {
                    NLayoutHeader,
                    NButton,
                    NTag
                }
            },
            props: {
                pageCount: 0
            }
        })

        // Find the primary button (Import Files)


        // To make it robust, we can look for the button that handles the click
        await wrapper.find('button[type="button"].n-button--primary-type').trigger('click')

        expect(wrapper.emitted('add-files')).toBeTruthy()
    })
})
