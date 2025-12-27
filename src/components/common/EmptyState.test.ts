import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EmptyState from './EmptyState.vue'
import { NButton } from 'naive-ui'

describe('EmptyState', () => {
    it('renders correctly', () => {
        const wrapper = mount(EmptyState, {
            global: {
                components: {
                    NButton
                }
            }
        })

        expect(wrapper.text()).toContain('Drop PDF or Images here')
        expect(wrapper.find('.empty-state-hero').exists()).toBe(true)
    })

    it('emits add-files event when button is clicked', async () => {
        const wrapper = mount(EmptyState, {
            global: {
                components: {
                    NButton
                }
            }
        })

        // Find button and click
        await wrapper.find('button.select-files-btn').trigger('click')
        expect(wrapper.emitted('add-files')).toBeTruthy()
    })
})
