import React, { useEffect, useState } from 'react'
import { Card, Grid, Label, Table } from 'semantic-ui-react'

import { useSubstrateState } from './substrate-lib'
import { encodeAddress } from '@polkadot/util-crypto'

const eventName = ev => `${ev.section}:${ev.method}`

function hex2a(hex) {
  var str = '';
  for (var i = 0; i < hex.length; i += 2) {
      var v = parseInt(hex.substr(i, 2), 16);
      if (v) str += String.fromCharCode(v);
  }
  return str;
}

function Main(props) {
  const { api } = useSubstrateState()

  const [allHosts, setAllHosts] = useState([])
  const [allHuddles, setAllHuddles] = useState([])

  const updateHosts = () => {
    const parsedHosts = []
    api.query.huddle.hosts.entries(result => {
      for (let host of result) {
        const acc = encodeAddress(host[0].slice(-32))
        const info = JSON.parse(host[1])
        parsedHosts.push({
          accountId: acc,
          socialAccount: info.socialAccount,
          socialProof: info.socialProof,
        })
      }
      setAllHosts(parsedHosts)
    })
  }

  const updateHuddles = () => {
    const parsedHuddles = []
    api.query.huddle.huddles.entries(result => {
      for (let huddle of result) {
        const host = encodeAddress(huddle[0].slice(-32))
        for (const h of JSON.parse(huddle[1])) {
          parsedHuddles.push({
            host,
            ...h,
          })
        }
      }
      setAllHuddles(parsedHuddles)
    })
  }

  useEffect(() => {
    let unsub = null
    updateHosts()
    updateHuddles()
    const allEvents = async () => {
      unsub = await api.query.system.events(events => {
        // loop through Events to check if something has changed in Huddle's Storage.
        events.forEach(record => {
          const { event } = record
          const evHuman = event.toHuman()
          const evName = eventName(evHuman)
          if (evName.includes('huddle:')) {
            updateHosts()
            updateHuddles()
          }
        })
      })
    }
    allEvents()
    return () => unsub && unsub()
  }, [api.query.system])

  return (
    <Grid.Column>
      <Card>
        <Card.Content textAlign="center">
        <h1>The Huddle Pallet</h1>
        </Card.Content>
      </Card>

      <h1>Hosts</h1>
      {allHosts.length === 0 ? (
        <Label basic color="yellow">
          No Hosts to be shown
        </Label>
      ) : (
        <Table celled striped size="small">
          <Table.Body>
            <Table.Row>
              <Table.Cell width={3} textAlign="center">
                <strong>AccountId</strong>
              </Table.Cell>
              <Table.Cell width={3} textAlign="center">
                <strong>SocialAccount</strong>
              </Table.Cell>
              <Table.Cell width={10} textAlign="center">
                <strong>SocialProof</strong>
              </Table.Cell>
            </Table.Row>
            {allHosts.map(h => (
              <Table.Row key={h.id}>
                <Table.Cell width={10} textAlign="center">
                  <span style={{ display: 'inline-block', minWidth: '28em' }}>
                    {h.accountId}
                  </span>
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  <span style={{ display: 'inline-block', minWidth: '28em' }}>
                    {hex2a(h.socialAccount)}
                  </span>
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  <span style={{ display: 'inline-block', minWidth: '28em' }}>
                    {hex2a(h.socialProof).startsWith("https://") || hex2a(h.socialProof).startsWith("http://") ?
                      <a href={hex2a(h.socialProof)} target="_blank">{hex2a(h.socialProof)}</a> :
                      hex2a(h.socialProof)
                    }
                  </span>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      <h1>Huddles</h1>
      {allHuddles.length === 0 ? (
        <Label basic color="yellow">
          No Hudles to be shown
        </Label>
      ) : (
        <Table celled striped size="small">
          <Table.Body>
            <Table.Row>
              <Table.Cell width={3} textAlign="center">
                <strong>Host</strong>
              </Table.Cell>
              <Table.Cell width={3} textAlign="center">
                <strong>Id</strong>
              </Table.Cell>
              <Table.Cell width={10} textAlign="center">
                <strong>Timestamp</strong>
              </Table.Cell>
              <Table.Cell width={10} textAlign="center">
                <strong>Guest</strong>
              </Table.Cell>
              <Table.Cell width={3} textAlign="center">
                <strong>Value</strong>
              </Table.Cell>
              <Table.Cell width={3} textAlign="center">
                <strong>Stars</strong>
              </Table.Cell>
              <Table.Cell width={3} textAlign="center">
                <strong>Status</strong>
              </Table.Cell>
            </Table.Row>
            {allHuddles.map(h => (
              <Table.Row key={h.id}>
                <Table.Cell width={3} textAlign="center">
                  {h.host}
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  {h.id}
                </Table.Cell>
                <Table.Cell width={10} textAlign="center">
                  <span style={{ display: 'inline-block', minWidth: '16em' }}>
                    {new Date(h.timestamp).toLocaleString() + " (" + h.timestamp + ")"}
                  </span>
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  <span style={{ display: 'inline-block', minWidth: '28em' }}>
                    {h.guest}
                  </span>
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  {h.value}
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  {h.stars}
                </Table.Cell>
                <Table.Cell width={3} textAlign="center">
                  {h.status}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Grid.Column>
  )
}

export default function Huddle(props) {
  const { api } = useSubstrateState()
  return api.query.huddle ? (
    <Main {...props} />
  ) : null
}
