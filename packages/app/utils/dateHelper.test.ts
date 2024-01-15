import { expect, it, describe } from '@jest/globals'
import { CommentsTime } from './dateHelper'
describe('CommentsTime', () => {
    it('time should be 0 sec ago', () => {
        expect(CommentsTime(new Date())).toBe("0 sec ago")
    })
    it('time should be 4 day ago', () => {
        let dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - 4);
        expect(CommentsTime(dateObj)).toBe("4 day ago")
    })
    it('time should be 1 mon ago', () => {
        let dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - 30);
        expect(CommentsTime(dateObj)).toBe("1 mon ago")
    })
    it('time should be 1 year ago', () => {
        let dateObj = new Date();
        dateObj.setDate(dateObj.getDate() - 365);
        expect(CommentsTime(dateObj)).toBe("1 year ago")
    })

})
