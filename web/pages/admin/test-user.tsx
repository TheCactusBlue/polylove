import { useEffect, useState } from 'react'
import { Button } from 'web/components/buttons/button'
import { Col } from 'web/components/layout/col'
import { Row } from 'web/components/layout/row'
import { Title } from 'web/components/widgets/title'
import { useRedirectIfSignedIn } from 'web/hooks/use-redirect-if-signed-in'
import { randomString } from 'common/util/random'
import { ExpandingInput } from 'web/components/widgets/expanding-input'
import { usePersistentLocalState } from 'web/hooks/use-persistent-local-state'
import { getCookie } from 'web/lib/util/cookie'
import { Input } from 'web/components/widgets/input'
import { db } from 'web/lib/supabase/db'

export default function TestUser() {
  useRedirectIfSignedIn('/')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createUserKey, setCreateUserKey] = usePersistentLocalState(
    '',
    'TEST_CREATE_USER_KEY'
  )

  useEffect(() => {
    setEmail('testNewUser+' + randomString() + '@gmail.com')
    setPassword(randomString())
    const key = 'TEST_CREATE_USER_KEY'
    const cookie = getCookie(key)
    if (cookie) setCreateUserKey(cookie.replace(/"/g, ''))
  }, [])

  const [submitting, setSubmitting] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  const create = async () => {
    setSubmitting(true)
    const { data, error } = await db.auth.signUp({
      email,
      password,
    })
    setSubmitting(false)
    if (error) {
      console.log('ERROR creating user', error.status, error.message)
    } else {
      console.log('SUCCESS creating user', data)
    }
  }

  const login = async () => {
    setSigningIn(true)
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    })
    setSigningIn(false)
    if (error) {
      console.log('ERROR logging in', error.status, error.message)
    } else {
      console.log('SUCCESS logging in', data)
    }
  }

  return (
    <Col className={'text-ink-600 items-center justify-items-center gap-1'}>
      <Title>Test New User Creation</Title>
      <Row className={'text-ink-600 text-sm'}>
        Set TEST_CREATE_USER_KEY to the proper value
      </Row>
      <ExpandingInput
        value={createUserKey}
        onChange={(e) => setCreateUserKey(e.target.value)}
        className={'w-80'}
        rows={5}
      />
      Email
      <Row className={'text-ink-500'}>{email}</Row>
      Password
      <Row className={'text-ink-500'}>{password}</Row>
      <Button loading={submitting} className={'mt-2'} onClick={create}>
        Submit
      </Button>
      <Row className={'w-full'}>
        <Col className={'w-full items-center'}>
          Email
          <Input
            className={'w-80'}
            value={email}
            onChange={(e) => setEmail(e.target.value || '')}
          />
          Password
          <Input
            className={'w-80'}
            value={password}
            onChange={(e) => setPassword(e.target.value || '')}
          />
          <Button loading={signingIn} className={'mt-2'} onClick={login}>
            Login
          </Button>
        </Col>
      </Row>
    </Col>
  )
}
