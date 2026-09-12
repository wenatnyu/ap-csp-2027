"""Build the two-page Chapter 6 evidence record for Community Shade Map."""
from build_advanced_sheets import Record, OUT, CONTENT_W, register_fonts


def build():
    d = Record(
        'AP_CSP_Chapter_6_Investigation_Sheet.pdf',
        'AP CSP | Chapter 6: Community Shade Map',
        'Original classroom investigation | Fictional data and simplified models, not real community findings')
    d.start('Part A | Access, representation and evidence')
    d.text('Name: __________________________  Partner: __________________  Date: __________')
    d.text('Purpose: collect residents\' reports of shade needs and compare North/South priorities. Use Chapter 6 Impact Lab. Predict before revealing results; record model evidence, not claims about real residents.')
    d.text('1. Access model | Which barriers does your plan remove?', True)
    d.text('100 potential participants, in mutually exclusive groups: 40 with no barriers; 20 network only; 15 device only; 10 skills only; 5 accessible-interface only; 10 both network and device. All of a person\'s barriers must be removed for modeled access.')
    d.text('Support costs: network 2, device 2, skills 1, accessible interface 1. Use budget 4. Each support removes its named barrier for everyone who has it. Access does not guarantee participation.')
    d.table([
        ['Support plan / cost', 'Predicted people with access', 'Observed model result'],
        ['No support / 0', '', ''],
        ['Network + device / ____', '', ''],
        ['Your plan: __________\nCost: ____', '', ''],
    ], [175, 164, CONTENT_W-339], 36)
    d.text('Explain your plan using the group counts. State one real-world barrier or assumption that the model does not test.', True)
    d.lines(2, 19)
    d.text('2. Representation model | Sample mix and population mix', True)
    d.text('Population: North 60%, South 40%. Constructed need rates within groups: North 20%, South 80%. Keep those rates fixed. Weight the rates by the indicated mix; report percentages.')
    d.table([
        ['Calculation', 'Predicted rate / working', 'Observed rate'],
        ['Sample mix 80% / 20%', '', ''],
        ['Population weights 60% / 40%', '', ''],
        ['Sample mix 60% / 40%', '', ''],
    ], [175, 194, CONTENT_W-369], 34)
    d.text('What changes when the mix changes? Why can population weighting still miss bias within either group?', True)
    d.lines(2, 19)
    d.finish_page()

    d.start('Part B | Privacy, security, reuse and a recommendation')
    d.text('3. Data and protection | Use #security; do not enter real personal data.', True)
    d.text('Fields: zone, shadeRating, name, email, exactGPS. Goal: North/South priorities.')
    d.table([
        ['Decision', 'Choice and reason'],
        ['Minimum fields to retain', ''],
        ['One field to omit', ''],
        ['Aggregate vs raw:\nbenefit + residual risk', ''],
    ], [152, CONTENT_W-152], 35)
    d.text('Give two different authentication-factor categories, an example of each, and a risk they reduce.', True)
    d.lines(2, 19)
    d.text('Model only: whose public key encrypts a confidential message to Blake, and whose private key decrypts it? Contrast symmetric encryption.', True)
    d.lines(2, 19)
    d.text('4. Reuse decisions | Apply the four simplified #responsibility cards.', True)
    d.text('Choose reuse with conditions, request permission, or replace. Cite the stated permission and required credit/change notes. Online access alone is not permission.')
    d.table([
        ['Card', 'Action / permission evidence / credit or change note'],
        ['Shade icon', ''],
        ['Research figure', ''],
        ['Your original code', ''],
        ['Online photo', ''],
    ], [130, CONTENT_W-130], 31)
    d.text('5. Recommend a plan. Cite both pages; include who benefits, a tradeoff and an open question.', True)
    d.lines(4, 19)
    d.finish_page()
    d.save()


if __name__ == '__main__':
    register_fonts()
    OUT.mkdir(parents=True, exist_ok=True)
    build()
