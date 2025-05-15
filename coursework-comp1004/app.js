import { createClient } from 'https://esm.sh/@supabase/supabase-js';


const supabaseUrl = 'https://qncgwnrexkjfcwiktbca.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuY2d3bnJleGtqZmN3aWt0YmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxODA3NzIsImV4cCI6MjA2Mjc1Njc3Mn0.LVpJZRNxAnqw3jgtRvWviQanV-hHLmSuTrAa993Dy80'
const supabase = createClient(supabaseUrl, supabaseKey)

function showMessage(elementId, message, isError = true) {
    const msgElement = document.getElementById(elementId)
    msgElement.textContent = message
    msgElement.className = isError ? 'error' : 'success'
    msgElement.style.display = 'block'
}

if (document.getElementById('peopleSearchForm')) {
    document.getElementById('peopleSearchForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const name = document.getElementById('name').value.trim()
        const license = document.getElementById('license').value.trim()
        const resultsDiv = document.getElementById('results')
        const messageDiv = document.getElementById('message')

        if (!name && !license) {
            showMessage('message', 'Error: Please enter name or license number')
            return
        }
        try {
            let query = supabase.from('People').select('*')
            if (name) query = query.ilike('Name', `%${name}%`)
            if (license) query = query.eq('LicenseNumber', license)
            const { data, error } = await query
            if (error) throw error
            if (data.length === 0) {
                showMessage('message', 'No result found')
                resultsDiv.innerHTML = ''
            } else {
                showMessage('message', 'Search successful', false)
                resultsDiv.innerHTML = data.map(person => `
                    <div class="result-item">
                      <p>Name: ${person.Name}</p>
                      <p>Address: ${person.Address}</p>
                      <p>License: ${person.LicenseNumber}</p>
                    </div>
                    `).join('')
            }

            } catch (err) {
                showMessage('message', `Error: ${err.message}`)
            }
        }
    )

}



if (document.getElementById('vehicleSearchForm')) {
    document.getElementById('vehicleSearchForm').addEventListener('submit', async (e) => 
  {
    e.preventDefault()
    const rego = document.getElementById('rego').value.trim()
    const resultsDiv = document.getElementById('results')
    const messageDiv = document.getElementById('message')
    if (!rego) {
        showMessage('message', 'Error: Please enter registration number')
        return
    }

    try {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('Vehicles')
          .select('*')
          .eq('VehicleID', rego);

        if (vehicleError) throw vehicleError

        if (vehicleData.length === 0) {
            showMessage('message', 'No vehicle found')
            resultsDiv.innerHTML = ''
            return
        }

        const vehicle = vehicleData[0]
        let ownerInfo = 'Owner unknown'
        if (vehicle.OwnerID) {
            const { data: ownerData, error:ownerError } = await supabase
               .from('People')
               .select('*')
               .eq('PersonID', vehicle.OwnerID)
            if (!ownerError && ownerData.length > 0) {
                ownerInfo = `Owner: ${ownerData[0].Name} (${ownerData[0].LicenseNumber})`
            }
        }

        showMessage('message', 'Search successful', false)
        resultsDiv.innerHTML = `
         <div class="result-item">
           <p>Registration: ${vehicle.VehicleID}</p>
           <p>Make: ${vehicle.Make}</p>
           <p>Model: ${vehicle.Model}</p>
           <p>Color: ${vehicle.Colour}</p>
           <p>${ownerInfo}</p>
         </div>
        `
    } catch (err) {
        showMessage('message', `Error: ${err.message}`)
    }


    })
}



if (document.getElementById('addVehicleForm')) {
    const addVehicleForm = document.getElementById('addVehicleForm')
    const newOwnerForm = document.getElementById('new-owner-form')
    let selectedOwnerId = null

    document.getElementById('checkOwner').addEventListener('click', async () => {
        const ownerName = document.getElementById('owner').value.trim()
        if (!ownerName) {
            showMessage('message-owner', 'Error: Please enter owner name')
            return
        }
        try {
            const { data, error } = await supabase
               .from('People')
               .select('*')
               .ilike('Name', `%${ownerName}%`)

            if (error) throw error
            const ownerResults = document.getElementById('owner-results')
            if (data.length > 0) {
                ownerResults.innerHTML = data.map(person => `
                    <div class="owner-option">
                       <p>${person.Name} - ${person.LicenseNumber}</p>
                       <button
                         class="select-owner"
                         data-id="${person.PersonID}"
                       >
                        Select owner
                        </button>
                    </div>
                `).join('')

                document.querySelectorAll('.select-owner').forEach(button => {
                   button.addEventListener('click', (e) => {
                    selectedOwnerId = e.currentTarget.dataset.id; 
                    document.getElementById('owner').value = e.currentTarget
                       .closest('.owner-option')
                       .querySelector('p').textContent.split(' - ')[0];
                    newOwnerForm.style.display = 'none'
                   });     
                })
                showMessage('message-owner', 'Matching owners found', false)
            } else {
                const ownerResults = document.getElementById('owner-results')
                ownerResults.innerHTML = `
                  <button id="new-owner-btn">New owner</button>
                `

                document.getElementById('new-owner-btn').addEventListener('click', () => {
                   newOwnerForm.style.display = 'block'
                })

                showMessage('message-owner', 'No matching owner found')
            }
        } catch (err) {
            showMessage('message-owner', `Error: ${err.message}`)
        }
    })

    document.getElementById('addOwner').addEventListener('click', async () => {
        const newOwner = {
            Name: document.getElementById('new-name').value.trim(),
            Address: document.getElementById('new-address').value.trim(),
            DOB: document.getElementById('new-dob').value.trim(),
            LicenseNumber: document.getElementById('new-license').value.trim(),
            ExpiryDate: document.getElementById('new-expire').value 
        }
        if (Object.values(newOwner).some(value => !value)) {
            showMessage('message-owner', 'Error: All fields are required')
            return
        }
        try {
            const { data: existingOwner, error } = await supabase
              .from('People')
              .select('*')
              .eq('Name', newOwner.Name)
              .eq('Address', newOwner.Address)
              .eq('DOB', newOwner.DOB)
              .eq('LicenseNumber', newOwner.LicenseNumber)

            if (error) throw error
            if (existingOwner.length > 0) {
                showMessage('message-owner', 'Error: Owner already exists')
                return
            }

            const { data: insertedOwner, error: insertError } = await supabase
              .from('People')
              .insert([newOwner])
              .select()

            if (insertError) throw insertError

            selectedOwnerId = insertedOwner[0].PersonID
            document.getElementById('owner').value = newOwner.Name
            newOwnerForm.style.display = 'none'
            showMessage('message-owner', 'Owner added successfully', false)
        } catch (err) {
            showMessage('message-owner', `Error: ${err.message}`)
        }
    })

    document.getElementById('addVehicle').addEventListener('click', async () => {
        const vehicleData = {
            VehicleID: document.getElementById('rego').value.trim(),
            Make: document.getElementById('make').value.trim(),
            Model: document.getElementById('model').value.trim(),
            Colour: document.getElementById('colour').value.trim(),
            OwnerID: selectedOwnerId
        }
        if (Object.values(vehicleData).slice(0, 4).some(value => !value)) {
            showMessage('message-vehicle', 'Error: All vehicle fields are required')
            return
        }
        try {
            const { error } = await supabase
              .from('Vehicles')
              .insert([vehicleData])

            if (error) throw error
            showMessage('message-vehicle', 'Vehicle added successfully', false)
            addVehicleForm.reset()
            newOwnerForm.style.display = 'none'
            document.getElementById('owner-results').innerHTML = ''
            selectedOwnerId = null
        } catch (err) {
            showMessage('message-vehicle', `Error: ${err.message}`)
        }
    })
}