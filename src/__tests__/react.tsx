import test from 'ava'
import * as React from 'react'
import { create } from 'react-test-renderer'
import { IocContext } from '../IocContext'
import { IocProvider, Component } from '../react'

test('react only reactcomponent.', t => {
    const context = IocContext.DefaultInstance
    class NRServiceDI { }
    context.register(NRServiceDI)

    class TestComponent extends Component<{}, {}> {
        componentWillMount() {
            t.true(this.GetComponent(NRServiceDI) instanceof NRServiceDI)
        }

        render(): any {
            return null
        }
    }

    create(
        <TestComponent />
    )
})

test('react IocProvider.', t => {
    const context = IocContext.DefaultInstance
    class NRServiceDI { }
    context.register(NRServiceDI)

    class TestComponent extends Component<{}, {}> {
        componentWillMount() {
            t.true(this.GetComponent(NRServiceDI) instanceof NRServiceDI)
        }

        render(): any {
            return null
        }
    }

    create(
        <IocProvider>
            <TestComponent />
        </IocProvider>
    )
})

test('react IocProvider with context.', t => {
    const context = new IocContext
    class NRService { }
    context.register(NRService)

    class TestComponent extends Component<{}, {}> {
        componentWillMount() {
            t.true(this.GetComponent(NRService) instanceof NRService)
        }

        render(): any {
            return null
        }
    }

    create(
        <IocProvider context={context}>
            <TestComponent />
        </IocProvider>
    )
})